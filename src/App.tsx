import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SlidersHorizontal, ArrowUpDown, X, Check } from 'lucide-react';
import { DEFAULT_ADDRESS, INITIAL_PRODUCTS } from './data/catalog';
import {
  ActiveOverlay,
  AuthUser,
  CartItem,
  CategoryId,
  DeliveryAddress,
  FilterState,
  Order,
  PaymentMethod,
  Product,
} from './types/meesho';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CategoryShowcase } from './components/CategoryShowcase';
import { FilterSidebar } from './components/FilterSidebar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { OverlayModal } from './components/OrdersWishlistViews';
import { AuthPage } from './components/AuthPage';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { useSmoothScroll } from './hooks/useSmoothScroll';

const STORAGE_KEYS = {
  cart: 'meesho_clone_cart_v1',
  wishlist: 'meesho_clone_wishlist_v1',
  address: 'meesho_clone_address_v1',
};

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  selectedCategories: [],
  subCategory: null,
  selectedGenders: [],
  selectedSizes: [],
  selectedFabrics: [],
  priceBracket: 'all',
  minRating: 0,
  minDiscount: 0,
  freeDeliveryOnly: false,
  codOnly: false,
  mallOrTrustedOnly: false,
  sortBy: 'relevance',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getProductIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/product\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getProductIdFromLocation(): string | null {
  return getProductIdFromPath(window.location.pathname);
}

function isAuthLocation(): boolean {
  return window.location.pathname === '/auth';
}

function getAuthSourceFromLocation(): 'profile' | 'cart' | 'supplier' {
  const source = new URLSearchParams(window.location.search).get('source');
  return source === 'cart' || source === 'supplier' ? source : 'profile';
}

function getAuthRedirectFromLocation(): string {
  const raw = new URLSearchParams(window.location.search).get('redirect');
  if (!raw) return '/';
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}` || '/';
    }
    return '/';
  } catch {
    return raw.startsWith('/') && !raw.startsWith('/auth') ? raw : '/';
  }
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>(() =>
    loadFromStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  );
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    loadFromStorage<string[]>(STORAGE_KEYS.wishlist, [])
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [address, setAddress] = useState<DeliveryAddress>(() =>
    loadFromStorage<DeliveryAddress>(STORAGE_KEYS.address, DEFAULT_ADDRESS)
  );

  // Auth session stored strictly in React memory (never localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() =>
    getProductIdFromLocation()
  );
  const [isAuthRoute, setIsAuthRoute] = useState<boolean>(() => isAuthLocation());
  const [authSource, setAuthSource] = useState<'profile' | 'cart' | 'supplier'>(() =>
    getAuthSourceFromLocation()
  );
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [pendingCartAction, setPendingCartAction] = useState<{
    product: Product;
    size?: string;
    openCartAfter: boolean;
  } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () =>
      selectedProductId
        ? products.find(
            (p) => p.id === selectedProductId || p.code === selectedProductId
          ) || null
        : null,
    [products, selectedProductId]
  );

  const lenisRef = useSmoothScroll({
    paused: activeOverlay !== null || mobileFiltersOpen,
    routeKey: `${isAuthRoute}-${selectedProductId || ''}-${products.length}-${filters.selectedCategories.join(',')}-${filters.subCategory || ''}`,
  });

  const scrollToTopSmooth = useCallback(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 0.7 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [lenisRef]);

  useEffect(() => {
    const handlePopState = () => {
      setSelectedProductId(getProductIdFromLocation());
      setIsAuthRoute(isAuthLocation());
      setAuthSource(getAuthSourceFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToProduct = useCallback(
    (product: Product) => {
      setIsAuthRoute(false);
      setSelectedProductId(product.id);
      if (window.location.pathname !== `/product/${product.id}`) {
        window.history.pushState({ productId: product.id }, '', `/product/${product.id}`);
      }
      scrollToTopSmooth();
    },
    [scrollToTopSmooth]
  );

  const navigateHome = useCallback(() => {
    setIsAuthRoute(false);
    setSelectedProductId(null);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const navigateToAuth = useCallback(
    (source: 'profile' | 'cart' | 'supplier' = 'profile') => {
      const currentRedirect =
        window.location.pathname === '/auth'
          ? getAuthRedirectFromLocation()
          : `${window.location.pathname}${window.location.search}` || '/';
      const fullRedirectUrl = `${window.location.origin}${
        currentRedirect.startsWith('/') ? currentRedirect : '/'
      }`;
      const authUrl = `/auth?redirect=${encodeURIComponent(
        fullRedirectUrl
      )}&source=${source}&entry=header&screen=HP`;

      setActiveOverlay(null);
      setAuthSource(source);
      setIsAuthRoute(true);
      if (`${window.location.pathname}${window.location.search}` !== authUrl) {
        window.history.pushState({ auth: true, source }, '', authUrl);
      }
      scrollToTopSmooth();
    },
    [scrollToTopSmooth]
  );

  const navigateBackFromAuth = useCallback(() => {
    setPendingCartAction(null);
    const redirectTarget = getAuthRedirectFromLocation();
    const targetPath = redirectTarget.split('?')[0] || '/';
    setIsAuthRoute(false);
    setSelectedProductId(getProductIdFromPath(targetPath));
    window.history.pushState({}, '', redirectTarget);
    scrollToTopSmooth();
  }, [scrollToTopSmooth]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.clearTimeout(
      (window as unknown as { __meeshoToastTimer?: number }).__meeshoToastTimer
    );
    (window as unknown as { __meeshoToastTimer?: number }).__meeshoToastTimer =
      window.setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = (await res.json()) as { products: Product[] };
        if (Array.isArray(data.products)) {
          setProducts(data.products);
        }
      }
    } catch {
      // Keep initial products fallback if network is unavailable
    }
  }, []);

  const fetchOrders = useCallback(async (token: string | null) => {
    if (!token) return;
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { orders: Order[] };
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch {
      // ignore transient error
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    if (authToken) {
      fetchOrders(authToken);
    }
  }, [authToken, fetchOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.address, JSON.stringify(address));
  }, [address]);

  const filteredProducts = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();

    const list = products.filter((p) => {
      if (query) {
        const matchesQuery =
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.subCategory.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.supplier.name.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      if (
        filters.selectedCategories.length > 0 &&
        !filters.selectedCategories.includes(p.category)
      ) {
        return false;
      }

      if (
        filters.subCategory &&
        filters.subCategory !== 'All Sarees' &&
        p.subCategory.toLowerCase() !== filters.subCategory.toLowerCase()
      ) {
        const subWords = filters.subCategory.toLowerCase().split(' ');
        const hitsSub = subWords.some(
          (w) =>
            w.length > 3 &&
            (p.subCategory.toLowerCase().includes(w) ||
              p.title.toLowerCase().includes(w))
        );
        if (!hitsSub) return false;
      }

      if (
        filters.selectedGenders.length > 0 &&
        (!p.gender || !filters.selectedGenders.includes(p.gender))
      ) {
        return false;
      }

      if (
        filters.selectedSizes.length > 0 &&
        !filters.selectedSizes.some((sz) => p.sizes.includes(sz))
      ) {
        return false;
      }

      if (
        filters.selectedFabrics.length > 0 &&
        !filters.selectedFabrics.some((fab) =>
          p.fabricOrMaterial.toLowerCase().includes(fab.toLowerCase())
        )
      ) {
        return false;
      }

      if (filters.priceBracket === 'under_299' && p.price > 299) return false;
      if (filters.priceBracket === 'under_499' && p.price > 499) return false;
      if (filters.priceBracket === 'under_799' && p.price > 799) return false;
      if (filters.priceBracket === 'above_800' && p.price < 800) return false;

      if (filters.minRating > 0 && p.rating < filters.minRating) return false;
      if (filters.minDiscount > 0 && p.discountPercent < filters.minDiscount) return false;
      if (filters.freeDeliveryOnly && !p.freeDelivery) return false;
      if (filters.codOnly && !p.codAvailable) return false;
      if (filters.mallOrTrustedOnly && !p.isMall && !p.isTrusted) return false;

      return true;
    });

    const sorted = [...list];
    if (filters.sortBy === 'price_low_high') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price_high_low') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    } else if (filters.sortBy === 'new_arrivals') {
      sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return sorted;
  }, [products, filters]);

  const handleSelectCategory = (
    cat: CategoryId | null,
    subCategory: string | null = null
  ) => {
    navigateHome();
    if (!cat) {
      setFilters((prev) => ({
        ...prev,
        selectedCategories: [],
        subCategory: null,
      }));
      return;
    }
    setFilters((prev) => ({
      ...prev,
      selectedCategories: [cat],
      subCategory,
    }));
    setTimeout(() => {
      const target = document.getElementById('products-for-you');
      if (!target) return;
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, { offset: -128, duration: 0.85 });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }, 40);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from Wishlist' : 'Saved to Wishlist');
      return next;
    });
  };

  const addItemToCartState = useCallback(
    (product: Product, size?: string) => {
      const chosenSize = size || product.sizes[0] || 'Free Size';
      const cartKey = `${product.id}__${chosenSize}`;

      setCart((prev) => {
        const existing = prev.find((i) => i.cartKey === cartKey);
        if (existing) {
          return prev.map((i) =>
            i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prev, { cartKey, product, size: chosenSize, quantity: 1 }];
      });
      showToast(`Added "${product.title.slice(0, 28)}..." to Cart`);
    },
    [showToast]
  );

  const handleAddToCart = (product: Product, size?: string) => {
    if (!authUser) {
      setPendingCartAction({ product, size, openCartAfter: false });
      navigateToAuth('cart');
      showToast('Sign in to add products to your Cart');
      return;
    }
    addItemToCartState(product, size);
  };

  const handleBuyNow = (product: Product, size: string) => {
    if (!authUser) {
      setPendingCartAction({ product, size, openCartAfter: true });
      navigateToAuth('cart');
      showToast('Sign in to continue to checkout');
      return;
    }
    addItemToCartState(product, size);
    setActiveOverlay('cart');
  };

  const handleUpdateQty = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (cartKey: string) => {
    setCart((prev) => prev.filter((i) => i.cartKey !== cartKey));
  };

  const handlePlaceOrder = async ({
    address: shippingAddr,
    paymentMethod,
    isReselling,
    resellerCustomerPrice,
  }: {
    address: DeliveryAddress;
    paymentMethod: PaymentMethod;
    isReselling: boolean;
    resellerCustomerPrice?: number;
  }): Promise<Order> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        items: cart.map((c) => ({
          productId: c.product.id,
          size: c.size,
          quantity: c.quantity,
        })),
        address: shippingAddr,
        paymentMethod,
        isReselling,
        resellerCustomerPrice,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { order: Order };
      setOrders((prev) => [data.order, ...prev]);
      setCart([]);
      return data.order;
    }

    throw new Error('Could not complete order.');
  };

  const handleCancelOrder = async (orderId: string) => {
    if (authToken) {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { order: Order };
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        showToast(`Order #${orderId} cancelled`);
        return;
      }
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled' } : o))
    );
    showToast(`Order #${orderId} cancelled`);
  };

  const handleAddReview = async (
    productId: string,
    author: string,
    rating: number,
    comment: string
  ) => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, rating, comment }),
      });
      if (res.ok) {
        const data = (await res.json()) as { product: Product };
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? data.product : p))
        );
        showToast('Thank you! Your review has been posted.');
      }
    } catch {
      showToast('Could not submit review.');
    }
  };

  const handlePublishSupplierProduct = async (payload: {
    title: string;
    category: CategoryId;
    price: number;
    mrp: number;
    supplierName: string;
    supplierCity: string;
    image: string;
  }): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const res = await fetch('/api/supplier/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as { product: Product };
        setProducts((prev) => [data.product, ...prev]);
        showToast('New supplier product published to catalog!');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleLoginSuccess = (token: string, user: AuthUser) => {
    setAuthToken(token);
    setAuthUser(user);
    if (user.phone && /^\d{10}$/.test(user.phone)) {
      setAddress((prev) => ({
        ...prev,
        phone: user.phone!,
        fullName: user.name || prev.fullName,
      }));
    }

    if (window.location.pathname === '/auth' || isAuthRoute) {
      const redirectTarget = getAuthRedirectFromLocation();
      const targetPath = redirectTarget.split('?')[0] || '/';
      setIsAuthRoute(false);
      setSelectedProductId(getProductIdFromPath(targetPath));
      window.history.replaceState({}, '', redirectTarget);
    }

    if (pendingCartAction) {
      const { product, size, openCartAfter } = pendingCartAction;
      setPendingCartAction(null);
      addItemToCartState(product, size);
      if (openCartAfter) {
        setActiveOverlay('cart');
        return;
      }
      if (user.role === 'admin') {
        setActiveOverlay('admin');
        return;
      }
      setActiveOverlay(null);
      return;
    }

    if (user.role === 'admin') {
      setActiveOverlay('admin');
      showToast(`Signed in as Admin (${user.identifier})`);
    } else {
      setActiveOverlay(null);
      showToast(`Welcome to Meesho, ${user.name}!`);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAuthUser(null);
    setOrders([]);
    setActiveOverlay(null);
    showToast('Signed out successfully');
  };

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#353543]">
      <Navbar
        searchQuery={filters.searchQuery}
        onSearchChange={(searchQuery) => {
          if (selectedProductId || isAuthRoute) navigateHome();
          setFilters((prev) => ({ ...prev, searchQuery }));
        }}
        selectedCategories={filters.selectedCategories}
        onSelectCategory={handleSelectCategory}
        cartCount={totalCartItems}
        wishlistCount={wishlistIds.length}
        ordersCount={orders.filter((o) => o.status !== 'Cancelled').length}
        onOpenOverlay={setActiveOverlay}
        onOpenAuth={navigateToAuth}
        isAuthPage={isAuthRoute}
        products={products}
        onSelectProduct={navigateToProduct}
        authUser={authUser}
      />

      <main className="flex-1">
        {isAuthRoute ? (
          <AuthPage
            source={authSource}
            onBack={navigateBackFromAuth}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : selectedProduct ? (
          <ProductDetailPage
            product={selectedProduct}
            allProducts={products}
            wishlistIds={wishlistIds}
            onBackHome={navigateHome}
            onSelectCategory={(cat) => handleSelectCategory(cat, null)}
            onOpenProduct={navigateToProduct}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onAddReview={handleAddReview}
          />
        ) : (
          <>
            {/* Hero Banner */}
            <HeroSection
              onShopNow={() =>
                document
                  .getElementById('products-for-you')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              onSelectCategory={(cat) => handleSelectCategory(cat, null)}
            />

            {/* Meesho Gold, Original Brands & Curated Deals Showcase */}
            <CategoryShowcase
              onPickCategory={(cat, sub) => handleSelectCategory(cat, sub || null)}
              onQuickFilter={({
                priceBracket,
                minRating,
                sortBy,
                searchQuery,
                category,
              }) => {
                setFilters({
                  ...INITIAL_FILTERS,
                  priceBracket: priceBracket || 'all',
                  minRating: minRating || 0,
                  sortBy: sortBy || 'relevance',
                  searchQuery: searchQuery || '',
                  selectedCategories: category ? [category] : [],
                });
              }}
            />

            {/* Products For You: Left Filter Sidebar + Product Grid */}
            <section
              id="products-for-you"
              className="max-w-[1360px] mx-auto px-4 lg:px-6 pt-4 pb-10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#353543] tracking-tight">
                    Products For You
                  </h2>
                  <p className="text-xs sm:text-sm text-[#616173] mt-0.5 tabular-nums">
                    Showing {filteredProducts.length} quality products with Free Delivery
                  </p>
                </div>

                {/* Active Filter Quick Clear */}
                {(filters.selectedCategories.length > 0 ||
                  filters.selectedGenders.length > 0 ||
                  filters.selectedSizes.length > 0 ||
                  filters.selectedFabrics.length > 0 ||
                  filters.subCategory ||
                  filters.searchQuery ||
                  filters.priceBracket !== 'all' ||
                  filters.minRating > 0 ||
                  filters.minDiscount > 0 ||
                  filters.freeDeliveryOnly ||
                  filters.codOnly ||
                  filters.mallOrTrustedOnly) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {filters.selectedCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            selectedCategories: prev.selectedCategories.filter(
                              (c) => c !== cat
                            ),
                            subCategory: null,
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#9F2089]/10 text-[#9F2089] text-xs font-semibold rounded-md cursor-pointer"
                      >
                        <span>{cat}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ))}
                    {filters.selectedGenders.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            selectedGenders: prev.selectedGenders.filter((x) => x !== g),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#9F2089]/10 text-[#9F2089] text-xs font-semibold rounded-md cursor-pointer"
                      >
                        <span>{g}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ))}
                    {filters.selectedFabrics.map((fab) => (
                      <button
                        key={fab}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            selectedFabrics: prev.selectedFabrics.filter((f) => f !== fab),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F8FA] border border-[#EAEAEF] text-[#353543] text-xs font-semibold rounded-md cursor-pointer"
                      >
                        <span>{fab}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ))}
                    {filters.selectedSizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            selectedSizes: prev.selectedSizes.filter((s) => s !== sz),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F8FA] border border-[#EAEAEF] text-[#353543] text-xs font-semibold rounded-md cursor-pointer"
                      >
                        <span>Size {sz}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ))}
                    {filters.subCategory && (
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, subCategory: null }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F8FA] border border-[#EAEAEF] text-[#353543] text-xs font-semibold rounded-md cursor-pointer"
                      >
                        <span>{filters.subCategory}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {filters.minDiscount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, minDiscount: 0 }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F8FA] border border-[#EAEAEF] text-[#353543] text-xs font-semibold rounded-md cursor-pointer"
                      >
                        <span>{filters.minDiscount}%+ Off</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {filters.mallOrTrustedOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, mallOrTrustedOnly: false }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F8FA] border border-[#EAEAEF] text-[#353543] text-xs font-semibold rounded-md cursor-pointer"
                      >
                        <span>Mall / mTrusted</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFilters(INITIAL_FILTERS)}
                      className="text-xs font-semibold text-[#9F2089] hover:underline px-2 py-1 cursor-pointer"
                    >
                      Reset All
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Sort & Filter Toolbar */}
              <div className="lg:hidden grid grid-cols-2 border border-[#EAEAEF] rounded-lg mb-4 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#353543] border-r border-[#EAEAEF]"
                >
                  <ArrowUpDown className="w-4 h-4 text-[#9F2089]" />
                  <span>Sort</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#353543]"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#9F2089]" />
                  <span>Filters</span>
                </button>
              </div>

              <div className="flex gap-6 items-start">
                <FilterSidebar
                  filters={filters}
                  onChange={setFilters}
                  onReset={() => setFilters(INITIAL_FILTERS)}
                  totalMatching={filteredProducts.length}
                  mobileOpen={mobileFiltersOpen}
                  onCloseMobile={() => setMobileFiltersOpen(false)}
                />

                {/* Product Grid */}
                <div className="flex-1 min-w-0">
                  {filteredProducts.length === 0 ? (
                    <div className="border border-[#EAEAEF] rounded-lg p-12 text-center bg-[#F8F8FA] space-y-3">
                      <p className="text-lg font-bold text-[#353543]">
                        No products match your selected filters
                      </p>
                      <p className="text-sm text-[#616173]">
                        Try clearing your search or widening your price and category filters.
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilters(INITIAL_FILTERS)}
                        className="px-5 py-2.5 bg-[#9F2089] text-white text-sm font-semibold rounded-md cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isWishlisted={wishlistIds.includes(product.id)}
                          onToggleWishlist={handleToggleWishlist}
                          onOpenProduct={navigateToProduct}
                          onQuickAdd={(p) => handleAddToCart(p)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {!isAuthRoute && (
        <Footer
          onSelectCategory={(cat) => handleSelectCategory(cat, null)}
          onBecomeSupplier={() => setActiveOverlay('supplier')}
        />
      )}

      {/* Slide-Over Cart & Checkout Drawer */}
      <CartCheckoutDrawer
        isOpen={activeOverlay === 'cart'}
        onClose={() => setActiveOverlay(null)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveCartItem}
        address={address}
        onSaveAddress={setAddress}
        onPlaceOrder={handlePlaceOrder}
        onViewOrders={() => setActiveOverlay('orders')}
      />

      {/* Orders / Wishlist / Supplier / Profile Modals */}
      <OverlayModal
        activeOverlay={
          activeOverlay === 'orders' ||
          activeOverlay === 'wishlist' ||
          activeOverlay === 'supplier' ||
          activeOverlay === 'profile'
            ? activeOverlay
            : null
        }
        onClose={() => setActiveOverlay(null)}
        orders={orders}
        onCancelOrder={handleCancelOrder}
        wishlistProducts={wishlistProducts}
        onToggleWishlist={handleToggleWishlist}
        onOpenProduct={navigateToProduct}
        onMoveToCart={(p) => {
          if (!authUser) {
            handleAddToCart(p);
            return;
          }
          handleAddToCart(p);
          setWishlistIds((prev) => prev.filter((id) => id !== p.id));
        }}
        address={address}
        onSaveAddress={setAddress}
        onPublishSupplierProduct={handlePublishSupplierProduct}
        authUser={authUser}
        onSwitchOverlay={setActiveOverlay}
        onOpenAuth={navigateToAuth}
        onLogout={handleLogout}
      />

      {/* Protected Admin Panel */}
      <AdminPanel
        isOpen={activeOverlay === 'admin'}
        onClose={() => setActiveOverlay(null)}
        authToken={authToken}
        authUser={authUser}
        products={products}
        orders={orders}
        onRefreshCatalog={fetchCatalog}
        onRefreshOrders={() => fetchOrders(authToken)}
        onNotify={showToast}
      />

      {/* Non-intrusive Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-[#353543] text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium">
          <Check className="w-4 h-4 text-[#038D63] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
