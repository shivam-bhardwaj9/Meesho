import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { INITIAL_PRODUCTS, PRODUCT_IMAGES } from './src/data/catalog.ts';
import {
  AuthUser,
  CategoryId,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
} from './src/types/meesho.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const ADMIN_EMAIL = 'shivambhardwaj9910@gmail.com';
const ADMIN_PHONE = '9315819414';

// In-memory stateful stores (seeded from authentic Meesho catalog)
let productsStore: Product[] = INITIAL_PRODUCTS.map((p) => ({
  ...p,
  reviews: [...p.reviews],
}));
const ordersStore: Order[] = [];
const usersStore = new Map<string, AuthUser>();

const ADMIN_DATA_DIR = path.resolve(__dirname, '.data');
const ADMIN_AUTH_FILE = path.join(ADMIN_DATA_DIR, 'admin-auth.json');

interface PersistedAdminHash {
  salt: string;
  hash: string;
}

function loadPersistedAdminHash(): PersistedAdminHash | null {
  try {
    if (!fs.existsSync(ADMIN_AUTH_FILE)) return null;
    const raw = fs.readFileSync(ADMIN_AUTH_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedAdminHash>;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return { salt: parsed.salt, hash: parsed.hash };
    }
    return null;
  } catch {
    return null;
  }
}

function savePersistedAdminHash(record: PersistedAdminHash): void {
  fs.mkdirSync(ADMIN_DATA_DIR, { recursive: true });
  fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(record), { mode: 0o600 });
}

// Admin credential state (process.env.ADMIN_PASSCODE or persisted claimed scrypt hash)
let claimedAdminHash: PersistedAdminHash | null = loadPersistedAdminHash();

interface OtpChallenge {
  otpHash: string;
  expiresAt: number;
  attempts: number;
  authType: 'phone' | 'email';
  identifier: string;
}
const otpChallenges = new Map<string, OtpChallenge>();

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isAdminIdentifier(authType: 'phone' | 'email', identifier: string): boolean {
  if (authType === 'email') {
    return normalizeEmail(identifier) === ADMIN_EMAIL;
  }
  return normalizePhone(identifier) === ADMIN_PHONE;
}

function isEnvAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
}

function isAdminSetupComplete(): boolean {
  return isEnvAdminConfigured() || claimedAdminHash !== null;
}

function hashSha256(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

function verifyAdminPassword(candidate: string): boolean {
  if (isEnvAdminConfigured()) {
    const expected = process.env.ADMIN_PASSCODE!.trim();
    return crypto.timingSafeEqual(hashSha256(candidate), hashSha256(expected));
  }
  if (!claimedAdminHash) return false;
  const derived = crypto.scryptSync(candidate, claimedAdminHash.salt, 64);
  const stored = Buffer.from(claimedAdminHash.hash, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

interface TokenPayload {
  sub: string;
  identifier: string;
  authType: 'phone' | 'email';
  role: 'customer' | 'admin';
  name: string;
  exp: number;
}

function signToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(body)
    .digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(body)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  authUser?: TokenPayload;
}

function extractBearerUser(req: AuthenticatedRequest): TokenPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return verifyToken(token);
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = extractBearerUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = extractBearerUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access denied.' });
    return;
  }
  req.authUser = user;
  next();
}

function upsertUserRecord(
  authType: 'phone' | 'email',
  identifier: string,
  role: 'customer' | 'admin',
  customName?: string
): AuthUser {
  const key = `${authType}:${identifier}`;
  const existing = usersStore.get(key);
  const now = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const user: AuthUser = {
    id: existing?.id || `usr-${crypto.randomBytes(4).toString('hex')}`,
    identifier,
    authType,
    name:
      customName?.trim() ||
      existing?.name ||
      (role === 'admin'
        ? 'Shivam Bhardwaj (Admin)'
        : authType === 'phone'
        ? `Shopper ${identifier.slice(-4)}`
        : identifier.split('@')[0]),
    phone:
      authType === 'phone'
        ? identifier
        : role === 'admin'
        ? ADMIN_PHONE
        : existing?.phone,
    email:
      authType === 'email'
        ? identifier
        : role === 'admin'
        ? ADMIN_EMAIL
        : existing?.email,
    role,
    loggedInAt: now,
  };

  usersStore.set(key, user);
  return user;
}

const ALLOWED_IMAGE_PATHS = new Set<string>(Object.values(PRODUCT_IMAGES));

function sanitizeImageUrl(url?: string): string {
  if (url && ALLOWED_IMAGE_PATHS.has(url)) {
    return url;
  }
  return PRODUCT_IMAGES.kurti;
}

type SmsDeliveryResult =
  | { configured: false; sent: false }
  | { configured: true; sent: true; provider: string }
  | { configured: true; sent: false; provider: string; error: string };

async function sendSmsOtp(phone10: string, otp: string): Promise<SmsDeliveryResult> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const params = new URLSearchParams({
        To: `+91${phone10}`,
        From: twilioFrom,
        Body: `${otp} is your Meesho verification OTP. Valid for 5 minutes. Do not share this code with anyone.`,
      });
      const authHeader = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilioSid)}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        return {
          configured: true,
          sent: false,
          provider: 'Twilio',
          error: `Twilio SMS failed (${response.status}): ${errText.slice(0, 160)}`,
        };
      }
      return { configured: true, sent: true, provider: 'Twilio' };
    } catch (err) {
      return {
        configured: true,
        sent: false,
        provider: 'Twilio',
        error: err instanceof Error ? err.message : 'Twilio request failed',
      };
    }
  }

  const fast2SmsKey = process.env.FAST2SMS_API_KEY?.trim();
  if (fast2SmsKey) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2SmsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phone10,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        return {
          configured: true,
          sent: false,
          provider: 'Fast2SMS',
          error: `Fast2SMS failed (${response.status}): ${errText.slice(0, 160)}`,
        };
      }
      return { configured: true, sent: true, provider: 'Fast2SMS' };
    } catch (err) {
      return {
        configured: true,
        sent: false,
        provider: 'Fast2SMS',
        error: err instanceof Error ? err.message : 'Fast2SMS request failed',
      };
    }
  }

  const twoFactorKey = process.env.TWOFACTOR_API_KEY?.trim();
  if (twoFactorKey) {
    try {
      const response = await fetch(
        `https://2factor.in/API/V1/${encodeURIComponent(twoFactorKey)}/SMS/+91${phone10}/${otp}`
      );
      if (!response.ok) {
        const errText = await response.text();
        return {
          configured: true,
          sent: false,
          provider: '2Factor',
          error: `2Factor SMS failed (${response.status}): ${errText.slice(0, 160)}`,
        };
      }
      return { configured: true, sent: true, provider: '2Factor' };
    } catch (err) {
      return {
        configured: true,
        sent: false,
        provider: '2Factor',
        error: err instanceof Error ? err.message : '2Factor request failed',
      };
    }
  }

  return { configured: false, sent: false };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // =========================================================================
  // AUTH ROUTES (Phone OTP + Email + Admin Bootstrap / Verification)
  // =========================================================================

  app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
    const tokenUser = extractBearerUser(req);
    if (!tokenUser) {
      res.status(401).json({ error: 'Not signed in' });
      return;
    }
    const key = `${tokenUser.authType}:${tokenUser.identifier}`;
    const stored = usersStore.get(key);
    res.json({
      user: stored || {
        id: tokenUser.sub,
        identifier: tokenUser.identifier,
        authType: tokenUser.authType,
        name: tokenUser.name,
        role: tokenUser.role,
        phone: tokenUser.authType === 'phone' ? tokenUser.identifier : undefined,
        email: tokenUser.authType === 'email' ? tokenUser.identifier : undefined,
        loggedInAt: 'Active Session',
      },
    });
  });

  app.post('/api/auth/request-otp', async (req: Request, res: Response) => {
    const { authType, identifier } = req.body as {
      authType?: 'phone' | 'email';
      identifier?: string;
    };

    if (authType !== 'phone' && authType !== 'email') {
      res.status(400).json({ error: 'Invalid login method.' });
      return;
    }

    const rawIdentifier = typeof identifier === 'string' ? identifier : '';
    const cleanId =
      authType === 'phone'
        ? normalizePhone(rawIdentifier)
        : normalizeEmail(rawIdentifier);

    if (authType === 'phone' && !/^[6-9]\d{9}$/.test(cleanId)) {
      res.status(400).json({
        error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9.',
      });
      return;
    }

    if (authType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    // Privileged admin identifiers require password verification / first-run setup
    if (isAdminIdentifier(authType, cleanId)) {
      res.json({
        requiresAdminAuth: true,
        isAdminClaimed: isAdminSetupComplete(),
        identifier: cleanId,
        authType,
      });
      return;
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const challengeKey = `${authType}:${cleanId}`;

    otpChallenges.set(challengeKey, {
      otpHash: hashSha256(otp).toString('hex'),
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      authType,
      identifier: cleanId,
    });

    if (authType === 'phone') {
      const smsResult = await sendSmsOtp(cleanId, otp);
      if (smsResult.configured) {
        if (!smsResult.sent) {
          otpChallenges.delete(challengeKey);
          res.status(502).json({
            error: `Could not deliver SMS OTP via ${smsResult.provider}. Please check your SMS provider credentials.`,
          });
          return;
        }
        res.json({
          requiresAdminAuth: false,
          identifier: cleanId,
          authType,
          expiresInSeconds: 300,
          smsDelivered: true,
          smsProvider: smsResult.provider,
        });
        return;
      }
    }

    res.json({
      requiresAdminAuth: false,
      identifier: cleanId,
      authType,
      expiresInSeconds: 300,
      smsDelivered: false,
      previewOtp: otp,
    });
  });

  app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
    const { authType, identifier, otp, name } = req.body as {
      authType?: 'phone' | 'email';
      identifier?: string;
      otp?: string;
      name?: string;
    };

    if (authType !== 'phone' && authType !== 'email') {
      res.status(400).json({ error: 'Invalid auth type.' });
      return;
    }

    const cleanId =
      authType === 'phone'
        ? normalizePhone(String(identifier || ''))
        : normalizeEmail(String(identifier || ''));

    if (isAdminIdentifier(authType, cleanId)) {
      res.status(403).json({
        error: 'Admin accounts must authenticate with your admin password.',
      });
      return;
    }

    const challengeKey = `${authType}:${cleanId}`;
    const challenge = otpChallenges.get(challengeKey);

    if (!challenge) {
      res.status(400).json({ error: 'OTP expired or not requested. Please resend.' });
      return;
    }

    if (challenge.expiresAt < Date.now()) {
      otpChallenges.delete(challengeKey);
      res.status(400).json({ error: 'OTP expired. Please request a new code.' });
      return;
    }

    if (challenge.attempts >= 5) {
      otpChallenges.delete(challengeKey);
      res.status(429).json({ error: 'Too many invalid attempts. Request a new OTP.' });
      return;
    }

    const cleanOtp = String(otp || '').trim();
    const candidateHash = hashSha256(cleanOtp);
    const storedHash = Buffer.from(challenge.otpHash, 'hex');

    if (
      candidateHash.length !== storedHash.length ||
      !crypto.timingSafeEqual(candidateHash, storedHash)
    ) {
      challenge.attempts += 1;
      res.status(401).json({ error: 'Invalid 6-digit OTP code.' });
      return;
    }

    otpChallenges.delete(challengeKey);

    const user = upsertUserRecord(authType, cleanId, 'customer', name);
    const token = signToken({
      sub: user.id,
      identifier: user.identifier,
      authType: user.authType,
      role: 'customer',
      name: user.name,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    });

    res.json({ token, user });
  });

  app.post('/api/auth/claim-admin', (req: Request, res: Response) => {
    if (isAdminSetupComplete()) {
      res.status(409).json({
        error: 'Admin password has already been claimed. Please sign in with your password.',
      });
      return;
    }

    const { authType, identifier, password } = req.body as {
      authType?: 'phone' | 'email';
      identifier?: string;
      password?: string;
    };

    if (authType !== 'phone' && authType !== 'email') {
      res.status(400).json({ error: 'Invalid login method.' });
      return;
    }

    const cleanId =
      authType === 'phone'
        ? normalizePhone(String(identifier || ''))
        : normalizeEmail(String(identifier || ''));

    if (!isAdminIdentifier(authType, cleanId)) {
      res.status(403).json({ error: 'Identifier is not authorized for admin setup.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        error: 'Admin password must be at least 6 characters long.',
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    claimedAdminHash = { salt, hash: derived };
    savePersistedAdminHash(claimedAdminHash);

    const user = upsertUserRecord(authType, cleanId, 'admin');
    const token = signToken({
      sub: user.id,
      identifier: user.identifier,
      authType: user.authType,
      role: 'admin',
      name: user.name,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    });

    res.json({ token, user });
  });

  app.post('/api/auth/admin-login', (req: Request, res: Response) => {
    if (!isAdminSetupComplete()) {
      res.status(400).json({
        error: 'Admin setup is not complete yet. Please set your admin password first.',
      });
      return;
    }

    const { authType, identifier, password } = req.body as {
      authType?: 'phone' | 'email';
      identifier?: string;
      password?: string;
    };

    if (authType !== 'phone' && authType !== 'email') {
      res.status(400).json({ error: 'Invalid login method.' });
      return;
    }

    const cleanId =
      authType === 'phone'
        ? normalizePhone(String(identifier || ''))
        : normalizeEmail(String(identifier || ''));

    if (!isAdminIdentifier(authType, cleanId)) {
      res.status(403).json({ error: 'Unauthorized admin identifier.' });
      return;
    }

    if (typeof password !== 'string' || !verifyAdminPassword(password)) {
      res.status(401).json({ error: 'Incorrect admin password.' });
      return;
    }

    const user = upsertUserRecord(authType, cleanId, 'admin');
    const token = signToken({
      sub: user.id,
      identifier: user.identifier,
      authType: user.authType,
      role: 'admin',
      name: user.name,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    });

    res.json({ token, user });
  });

  // =========================================================================
  // STOREFRONT CATALOG & ORDER ROUTES
  // =========================================================================

  app.get('/api/products', (_req: Request, res: Response) => {
    res.json({ products: productsStore });
  });

  app.post('/api/products/:id/reviews', (req: Request, res: Response) => {
    const product = productsStore.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const { author, rating, comment } = req.body as {
      author?: string;
      rating?: number;
      comment?: string;
    };

    const numericRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
    const cleanComment = typeof comment === 'string' ? comment.trim() : '';
    if (!cleanComment) {
      res.status(400).json({ error: 'Review comment cannot be empty.' });
      return;
    }

    const newReview = {
      id: `rev-${Date.now()}`,
      author: (typeof author === 'string' && author.trim()) || 'Verified Shopper',
      rating: numericRating,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      comment: cleanComment.slice(0, 500),
      helpfulCount: 0,
      verified: true,
    };

    const nextCount = product.ratingCount + 1;
    product.rating = Number(
      ((product.rating * product.ratingCount + numericRating) / nextCount).toFixed(1)
    );
    product.ratingCount = nextCount;
    product.reviewCount += 1;
    product.reviews = [newReview, ...product.reviews];

    res.status(201).json({ product, review: newReview });
  });

  app.post('/api/supplier/products', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const {
      title,
      category,
      price,
      mrp,
      supplierName,
      supplierCity,
      image,
      fabricOrMaterial,
    } = req.body as {
      title?: string;
      category?: CategoryId;
      price?: number;
      mrp?: number;
      supplierName?: string;
      supplierCity?: string;
      image?: string;
      fabricOrMaterial?: string;
    };

    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (cleanTitle.length < 3) {
      res.status(400).json({ error: 'Product title must be at least 3 characters.' });
      return;
    }

    const cleanPrice = Math.max(99, Math.round(Number(price) || 299));
    const cleanMrp = Math.max(cleanPrice + 50, Math.round(Number(mrp) || cleanPrice * 2));
    const discountPercent = Math.round(((cleanMrp - cleanPrice) / cleanMrp) * 100);
    const cat: CategoryId = category || 'Women Ethnic';

    const newProduct: Product = {
      id: `msh-sup-${Date.now()}`,
      code: `s-${crypto.randomInt(10000000, 99999999)}`,
      title: cleanTitle.slice(0, 140),
      category: cat,
      subCategory: cat,
      price: cleanPrice,
      mrp: cleanMrp,
      discountPercent,
      stock: 50,
      rating: 4.5,
      ratingCount: 1,
      reviewCount: 0,
      image: sanitizeImageUrl(image),
      freeDelivery: true,
      codAvailable: true,
      sizes:
        cat === 'Electronics' || cat === 'Jewellery & Accessories'
          ? ['Free Size']
          : ['S', 'M', 'L', 'XL'],
      fabricOrMaterial:
        (typeof fabricOrMaterial === 'string' && fabricOrMaterial.trim()) ||
        'Premium Quality Material',
      pattern: 'Supplier Catalog Launch',
      netQuantity: '1 Unit',
      countryOfOrigin: 'India',
      description: `Direct-from-supplier listing by ${
        (typeof supplierName === 'string' && supplierName.trim()) || 'Verified Supplier'
      } at 0% Meesho commission.`,
      supplier: {
        name:
          (typeof supplierName === 'string' && supplierName.trim()) ||
          'Meesho Verified Supplier',
        city:
          (typeof supplierCity === 'string' && supplierCity.trim()) || 'India',
        rating: 4.4,
        followers: '1.4K',
        productsCount: 12,
      },
      isTrusted: true,
      reviews: [],
      createdAt: Date.now(),
    };

    productsStore = [newProduct, ...productsStore];
    res.status(201).json({ product: newProduct });
  });

  app.get('/api/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.role === 'admin') {
      res.json({ orders: ordersStore });
      return;
    }
    const mine = ordersStore.filter(
      (o) => o.userId === user.sub || o.userIdentifier === user.identifier
    );
    res.json({ orders: mine });
  });

  app.post('/api/orders', (req: AuthenticatedRequest, res: Response) => {
    const authUser = extractBearerUser(req);
    const { items, address, paymentMethod, isReselling, resellerCustomerPrice } =
      req.body as {
        items?: { productId: string; size: string; quantity: number }[];
        address?: Order['address'];
        paymentMethod?: PaymentMethod;
        isReselling?: boolean;
        resellerCustomerPrice?: number;
      };

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Cart cannot be empty.' });
      return;
    }

    if (
      !address ||
      !address.fullName?.trim() ||
      !/^\d{10}$/.test(String(address.phone || '').trim()) ||
      !/^\d{6}$/.test(String(address.pincode || '').trim())
    ) {
      res.status(400).json({ error: 'Valid delivery address is required.' });
      return;
    }

    // Recompute totals strictly on the server from authoritative catalog prices
    const resolvedItems: Order['items'] = [];
    let productTotal = 0;
    let finalPayable = 0;

    for (const entry of items) {
      const catalogProduct = productsStore.find((p) => p.id === entry.productId);
      if (!catalogProduct) {
        res.status(400).json({ error: 'One or more products are no longer available.' });
        return;
      }
      const qty = Math.max(1, Math.min(20, Math.round(Number(entry.quantity) || 1)));
      const size = String(entry.size || catalogProduct.sizes[0] || 'Free Size').slice(0, 40);

      productTotal += catalogProduct.mrp * qty;
      finalPayable += catalogProduct.price * qty;

      resolvedItems.push({
        cartKey: `${catalogProduct.id}__${size}`,
        product: catalogProduct,
        size,
        quantity: qty,
      });
    }

    const discountTotal = Math.max(0, productTotal - finalPayable);
    const resellerFlag = Boolean(isReselling);
    const cleanResellerPrice =
      resellerFlag && Number(resellerCustomerPrice) >= finalPayable
        ? Math.round(Number(resellerCustomerPrice))
        : finalPayable;
    const resellerMargin = resellerFlag
      ? Math.max(0, cleanResellerPrice - finalPayable)
      : 0;

    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + 4);
    const estimatedDelivery = etaDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newOrder: Order = {
      id: `MSH${crypto.randomInt(100000, 999999)}`,
      placedAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Confirmed',
      userId: authUser?.sub,
      userIdentifier: authUser?.identifier || address.phone,
      items: resolvedItems,
      address,
      paymentMethod: paymentMethod || 'cod',
      productTotal,
      discountTotal,
      finalPayable,
      isReselling: resellerFlag,
      resellerCustomerPrice: resellerFlag ? cleanResellerPrice : undefined,
      resellerMargin,
      estimatedDelivery,
    };

    ordersStore.unshift(newOrder);
    res.status(201).json({ order: newOrder });
  });

  app.patch('/api/orders/:id/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const order = ordersStore.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const user = req.authUser!;
    const ownsOrder =
      order.userId === user.sub || order.userIdentifier === user.identifier;
    if (user.role !== 'admin' && !ownsOrder) {
      res.status(403).json({ error: 'Not authorized to cancel this order.' });
      return;
    }

    order.status = 'Cancelled';
    res.json({ order });
  });

  // =========================================================================
  // PROTECTED ADMIN PANEL ROUTES (Requires Admin Role)
  // =========================================================================

  app.get('/api/admin/dashboard', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const activeOrders = ordersStore.filter((o) => o.status !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((s, o) => s + o.finalPayable, 0);
    const resellerMarginTotal = activeOrders.reduce(
      (s, o) => s + (o.resellerMargin || 0),
      0
    );
    const lowStockCount = productsStore.filter((p) => p.stock < 40).length;

    res.json({
      metrics: {
        totalRevenue,
        totalOrders: ordersStore.length,
        activeOrders: activeOrders.length,
        totalProducts: productsStore.length,
        lowStockCount,
        totalUsers: usersStore.size,
        resellerMarginTotal,
      },
      users: Array.from(usersStore.values()),
    });
  });

  app.post('/api/admin/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const {
      title,
      category,
      subCategory,
      price,
      mrp,
      stock,
      fabricOrMaterial,
      supplierName,
      supplierCity,
      image,
      isTrusted,
    } = req.body as {
      title?: string;
      category?: CategoryId;
      subCategory?: string;
      price?: number;
      mrp?: number;
      stock?: number;
      fabricOrMaterial?: string;
      supplierName?: string;
      supplierCity?: string;
      image?: string;
      isTrusted?: boolean;
    };

    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (cleanTitle.length < 3) {
      res.status(400).json({ error: 'Product title is required.' });
      return;
    }

    const cleanPrice = Math.max(49, Math.round(Number(price) || 299));
    const cleanMrp = Math.max(cleanPrice + 20, Math.round(Number(mrp) || cleanPrice * 2));
    const discountPercent = Math.round(((cleanMrp - cleanPrice) / cleanMrp) * 100);
    const cat: CategoryId = category || 'Women Ethnic';

    const created: Product = {
      id: `msh-adm-${Date.now()}`,
      code: `s-${crypto.randomInt(10000000, 99999999)}`,
      title: cleanTitle.slice(0, 140),
      category: cat,
      subCategory: (typeof subCategory === 'string' && subCategory.trim()) || cat,
      price: cleanPrice,
      mrp: cleanMrp,
      discountPercent,
      stock: Math.max(0, Math.round(Number(stock) ?? 100)),
      rating: 4.4,
      ratingCount: 12,
      reviewCount: 2,
      image: sanitizeImageUrl(image),
      freeDelivery: true,
      codAvailable: true,
      sizes:
        cat === 'Electronics' || cat === 'Jewellery & Accessories'
          ? ['Free Size']
          : ['S', 'M', 'L', 'XL'],
      fabricOrMaterial:
        (typeof fabricOrMaterial === 'string' && fabricOrMaterial.trim()) ||
        'Premium Selected Material',
      pattern: 'Meesho Direct Catalog',
      netQuantity: '1 Unit',
      countryOfOrigin: 'India',
      description: `Verified Meesho catalog product supplied by ${
        (typeof supplierName === 'string' && supplierName.trim()) || 'Surat Textile House'
      }.`,
      supplier: {
        name:
          (typeof supplierName === 'string' && supplierName.trim()) ||
          'Surat Textile House',
        city:
          (typeof supplierCity === 'string' && supplierCity.trim()) ||
          'Surat, Gujarat',
        rating: 4.4,
        followers: '24.5K',
        productsCount: 84,
      },
      isTrusted: isTrusted ?? true,
      reviews: [],
      createdAt: Date.now(),
    };

    productsStore = [created, ...productsStore];
    res.status(201).json({ product: created });
  });

  app.patch('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const product = productsStore.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const { title, price, mrp, stock, isTrusted } = req.body as {
      title?: string;
      price?: number;
      mrp?: number;
      stock?: number;
      isTrusted?: boolean;
    };

    if (typeof title === 'string' && title.trim().length >= 3) {
      product.title = title.trim().slice(0, 140);
    }
    if (price !== undefined && !Number.isNaN(Number(price))) {
      product.price = Math.max(49, Math.round(Number(price)));
    }
    if (mrp !== undefined && !Number.isNaN(Number(mrp))) {
      product.mrp = Math.max(product.price, Math.round(Number(mrp)));
    }
    if (stock !== undefined && !Number.isNaN(Number(stock))) {
      product.stock = Math.max(0, Math.round(Number(stock)));
    }
    if (typeof isTrusted === 'boolean') {
      product.isTrusted = isTrusted;
    }
    product.discountPercent = Math.max(
      0,
      Math.round(((product.mrp - product.price) / product.mrp) * 100)
    );

    res.json({ product });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const before = productsStore.length;
    productsStore = productsStore.filter((p) => p.id !== req.params.id);
    if (productsStore.length === before) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.patch(
    '/api/admin/orders/:id/status',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const order = ordersStore.find((o) => o.id === req.params.id);
      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      const { status } = req.body as { status?: OrderStatus };
      const allowed: OrderStatus[] = [
        'Confirmed',
        'Packed',
        'Shipped',
        'Delivered',
        'Cancelled',
      ];
      if (!status || !allowed.includes(status)) {
        res.status(400).json({ error: 'Invalid order status.' });
        return;
      }

      order.status = status;
      res.json({ order });
    }
  );

  app.patch('/api/admin/password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (typeof currentPassword !== 'string' || !verifyAdminPassword(currentPassword)) {
      res.status(401).json({ error: 'Current admin password is incorrect.' });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'New admin password must be at least 6 characters.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(newPassword, salt, 64).toString('hex');
    claimedAdminHash = { salt, hash: derived };
    savePersistedAdminHash(claimedAdminHash);

    res.json({ ok: true });
  });

  // =========================================================================
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Meesho storefront server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
