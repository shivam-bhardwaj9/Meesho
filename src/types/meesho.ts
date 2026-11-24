export type CategoryId =
  | 'Women Ethnic'
  | 'Women Western'
  | 'Men'
  | 'Kids'
  | 'Home & Kitchen'
  | 'Beauty & Health'
  | 'Jewellery & Accessories'
  | 'Bags & Footwear'
  | 'Electronics'
  | 'Watches'
  | 'Sports & Fitness'
  | 'Grocery'
  | 'Books';

export type GenderFilter = 'Boys' | 'Girls' | 'Men' | 'Women';

export type SortOption =
  | 'relevance'
  | 'new_arrivals'
  | 'price_high_low'
  | 'price_low_high'
  | 'rating';

export type PriceBracket = 'all' | 'under_299' | 'under_499' | 'under_799' | 'above_800';

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  helpfulCount: number;
  verified: boolean;
}

export interface Product {
  id: string;
  code: string;
  title: string;
  category: CategoryId;
  subCategory: string;
  gender?: GenderFilter;
  price: number;
  mrp: number;
  discountPercent: number;
  stock: number;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  image: string;
  freeDelivery: boolean;
  deliveryFee?: number;
  codAvailable: boolean;
  sizes: string[];
  fabricOrMaterial: string;
  pattern: string;
  netQuantity: string;
  countryOfOrigin: string;
  description: string;
  supplier: {
    name: string;
    city: string;
    rating: number;
    followers: string;
    productsCount: number;
  };
  reviews: ProductReview[];
  isTrusted?: boolean;
  isMall?: boolean;
  moreVariants?: number;
  createdAt?: number;
}

export interface CategoryNavGroup {
  id: CategoryId;
  label: string;
  columns: {
    heading: string;
    items: string[];
  }[];
}

export interface CartItem {
  cartKey: string;
  product: Product;
  size: string;
  quantity: number;
}

export interface DeliveryAddress {
  id: string;
  fullName: string;
  phone: string;
  houseNo: string;
  streetArea: string;
  pincode: string;
  city: string;
  state: string;
}

export type PaymentMethod = 'cod' | 'upi' | 'card' | 'netbanking';

export type OrderStatus = 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  placedAt: string;
  status: OrderStatus;
  userId?: string;
  userIdentifier?: string;
  items: CartItem[];
  address: DeliveryAddress;
  paymentMethod: PaymentMethod;
  productTotal: number;
  discountTotal: number;
  finalPayable: number;
  isReselling: boolean;
  resellerCustomerPrice?: number;
  resellerMargin?: number;
  estimatedDelivery: string;
}

export interface FilterState {
  searchQuery: string;
  selectedCategories: CategoryId[];
  subCategory: string | null;
  selectedGenders: GenderFilter[];
  selectedSizes: string[];
  selectedFabrics: string[];
  priceBracket: PriceBracket;
  minRating: number;
  minDiscount: number;
  freeDeliveryOnly: boolean;
  codOnly: boolean;
  mallOrTrustedOnly: boolean;
  sortBy: SortOption;
}

export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  identifier: string;
  authType: 'phone' | 'email';
  name: string;
  phone?: string;
  email?: string;
  role: UserRole;
  loggedInAt: string;
}

export interface AdminDashboardData {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    activeOrders: number;
    totalProducts: number;
    lowStockCount: number;
    totalUsers: number;
    resellerMarginTotal: number;
  };
  users: AuthUser[];
}

export type ActiveOverlay =
  | null
  | 'cart'
  | 'orders'
  | 'wishlist'
  | 'supplier'
  | 'profile'
  | 'admin';
