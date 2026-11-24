import React, { useState } from 'react';
import {
  X,
  Package,
  Heart,
  Store,
  User,
  Trash2,
  ShoppingBag,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  Phone,
} from 'lucide-react';
import { CATEGORY_NAV_GROUPS, PRODUCT_IMAGES } from '../data/catalog';
import {
  ActiveOverlay,
  AuthUser,
  CategoryId,
  DeliveryAddress,
  Order,
  Product,
} from '../types/meesho';

interface OverlayModalProps {
  activeOverlay: 'orders' | 'wishlist' | 'supplier' | 'profile' | null;
  onClose: () => void;
  orders: Order[];
  onCancelOrder: (orderId: string) => void;
  wishlistProducts: Product[];
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (product: Product) => void;
  onMoveToCart: (product: Product) => void;
  address: DeliveryAddress;
  onSaveAddress: (addr: DeliveryAddress) => void;
  onPublishSupplierProduct: (payload: {
    title: string;
    category: CategoryId;
    price: number;
    mrp: number;
    supplierName: string;
    supplierCity: string;
    image: string;
  }) => Promise<boolean>;
  authUser: AuthUser | null;
  onSwitchOverlay: (overlay: ActiveOverlay) => void;
  onOpenAuth: (source?: 'profile' | 'cart' | 'supplier') => void;
  onLogout: () => void;
}

export const OverlayModal: React.FC<OverlayModalProps> = ({
  activeOverlay,
  onClose,
  orders,
  onCancelOrder,
  wishlistProducts,
  onToggleWishlist,
  onOpenProduct,
  onMoveToCart,
  address,
  onPublishSupplierProduct,
  authUser,
  onSwitchOverlay,
  onOpenAuth,
  onLogout,
}) => {
  const [supplierTitle, setSupplierTitle] = useState('');
  const [supplierCategory, setSupplierCategory] = useState<CategoryId>('Women Ethnic');
  const [supplierPrice, setSupplierPrice] = useState('349');
  const [supplierMrp, setSupplierMrp] = useState('799');
  const [supplierName, setSupplierName] = useState('Mahalaxmi Creations');
  const [supplierCity, setSupplierCity] = useState('Surat, Gujarat');
  const [supplierSuccess, setSupplierSuccess] = useState<string | null>(null);
  const [supplierError, setSupplierError] = useState<string | null>(null);

  if (!activeOverlay) return null;

  const totalResellerEarnings = orders.reduce(
    (sum, o) => sum + (o.status !== 'Cancelled' ? o.resellerMargin || 0 : 0),
    0
  );

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierError(null);
    setSupplierSuccess(null);

    if (!authUser) {
      onOpenAuth('supplier');
      return;
    }

    const price = Math.max(99, Number(supplierPrice) || 299);
    const mrp = Math.max(price + 50, Number(supplierMrp) || price * 2);

    const imageByCat: Record<CategoryId, string> = {
      'Women Ethnic': PRODUCT_IMAGES.kurti,
      'Women Western': PRODUCT_IMAGES.western,
      Men: PRODUCT_IMAGES.mensShirt,
      Kids: PRODUCT_IMAGES.kidsEthnic,
      'Home & Kitchen': PRODUCT_IMAGES.kitchen,
      'Beauty & Health': PRODUCT_IMAGES.skincare,
      'Jewellery & Accessories': PRODUCT_IMAGES.jewellery,
      'Bags & Footwear': PRODUCT_IMAGES.handbag,
      Electronics: PRODUCT_IMAGES.earbuds,
      Watches: PRODUCT_IMAGES.smartwatch,
      'Sports & Fitness': PRODUCT_IMAGES.sneakers,
      Grocery: PRODUCT_IMAGES.kitchen,
      Books: PRODUCT_IMAGES.bedsheet,
    };

    const ok = await onPublishSupplierProduct({
      title:
        supplierTitle.trim() ||
        `${supplierName} Signature Festive Collection (${supplierCategory})`,
      category: supplierCategory,
      price,
      mrp,
      supplierName: supplierName.trim() || 'Meesho Verified Supplier',
      supplierCity: supplierCity.trim() || 'India',
      image: imageByCat[supplierCategory],
    });

    if (ok) {
      setSupplierSuccess(`Product published live to the Meesho catalog!`);
      setSupplierTitle('');
    } else {
      setSupplierError('Could not publish product. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-0 sm:p-4">
      <div className="bg-white w-full max-w-[780px] h-full sm:h-auto sm:max-h-[88vh] sm:rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EAEAEF] flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#353543]">
            {activeOverlay === 'orders' && <Package className="w-5 h-5 text-[#9F2089]" />}
            {activeOverlay === 'wishlist' && <Heart className="w-5 h-5 text-[#F43397]" />}
            {activeOverlay === 'supplier' && <Store className="w-5 h-5 text-[#9F2089]" />}
            {activeOverlay === 'profile' && <User className="w-5 h-5 text-[#9F2089]" />}
            <h2 className="text-lg font-bold">
              {activeOverlay === 'orders' && 'My Orders'}
              {activeOverlay === 'wishlist' && `My Wishlist (${wishlistProducts.length})`}
              {activeOverlay === 'supplier' && 'Become a Meesho Supplier (0% Commission)'}
              {activeOverlay === 'profile' && 'My Meesho Profile'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#616173] hover:bg-[#F8F8FA] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto meesho-scroll p-5 space-y-4">
          {/* MY ORDERS */}
          {activeOverlay === 'orders' && (
            <>
              {orders.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Package className="w-10 h-10 text-[#8B8BA3] mx-auto" />
                  <p className="text-base font-bold text-[#353543]">No orders placed yet</p>
                  <p className="text-sm text-[#616173]">
                    Add products to your cart and place an order with Free Delivery or COD.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-[#EAEAEF] rounded-lg p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EAEAEF]">
                        <div>
                          <p className="text-xs text-[#616173]">
                            Order ID: <span className="font-mono font-semibold text-[#353543]">#{order.id}</span> · Placed on {order.placedAt}
                          </p>
                          <p
                            className={`text-xs font-bold mt-0.5 ${
                              order.status === 'Cancelled'
                                ? 'text-red-600'
                                : 'text-[#038D63]'
                            }`}
                          >
                            {order.status}{' '}
                            {order.status !== 'Cancelled'
                              ? `· Expected by ${order.estimatedDelivery}`
                              : ''}
                          </p>
                        </div>
                        <div className="text-right tabular-nums">
                          <p className="text-sm font-bold text-[#353543]">
                            ₹{order.finalPayable}
                          </p>
                          {order.isReselling && order.resellerMargin ? (
                            <p className="text-[11px] font-semibold text-[#038D63]">
                              Margin: +₹{order.resellerMargin}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {order.items.map((item) => (
                          <div key={item.cartKey} className="flex items-center gap-3">
                            <img
                              src={item.product.image}
                              alt={item.product.title}
                              referrerPolicy="no-referrer"
                              className="w-12 h-14 object-cover rounded border border-[#EAEAEF]"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#353543] truncate">
                                {item.product.title}
                              </p>
                              <p className="text-xs text-[#616173] tabular-nums">
                                Size: {item.size} · Qty: {item.quantity} · ₹{item.product.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.status !== 'Cancelled' && (
                        <div className="pt-2 flex items-center justify-between border-t border-[#EAEAEF]">
                          <span className="text-xs text-[#616173]">
                            Ship to: {order.address.city} ({order.address.pincode})
                          </span>
                          <button
                            type="button"
                            onClick={() => onCancelOrder(order.id)}
                            className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* WISHLIST */}
          {activeOverlay === 'wishlist' && (
            <>
              {wishlistProducts.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Heart className="w-10 h-10 text-[#8B8BA3] mx-auto" />
                  <p className="text-base font-bold text-[#353543]">Your wishlist is empty</p>
                  <p className="text-sm text-[#616173]">
                    Tap the heart icon on any product to save it here for later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {wishlistProducts.map((item) => (
                    <div
                      key={item.id}
                      className="border border-[#EAEAEF] rounded-lg p-3 flex gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenProduct(item);
                        }}
                        className="w-20 h-24 rounded overflow-hidden border border-[#EAEAEF] shrink-0 cursor-pointer"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#353543] line-clamp-2">
                            {item.title}
                          </p>
                          <p className="text-sm font-bold text-[#353543] mt-1 tabular-nums">
                            ₹{item.price}{' '}
                            <span className="text-xs text-[#8B8BA3] line-through font-normal">
                              ₹{item.mrp}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => onMoveToCart(item)}
                            className="flex-1 py-1.5 px-2 bg-[#9F2089] text-white text-xs font-semibold rounded flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Move to Cart</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleWishlist(item.id)}
                            className="p-1.5 border border-[#EAEAEF] rounded text-[#616173] hover:text-red-600 cursor-pointer"
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* SUPPLIER PORTAL */}
          {activeOverlay === 'supplier' && (
            <div className="space-y-5">
              <div className="bg-[#F8F8FA] border border-[#EAEAEF] rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-extrabold text-[#9F2089] tabular-nums">0%</p>
                  <p className="text-xs text-[#616173]">Commission Fee</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[#9F2089] tabular-nums">14 Cr+</p>
                  <p className="text-xs text-[#616173]">Active Shoppers</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[#9F2089] tabular-nums">7 Days</p>
                  <p className="text-xs text-[#616173]">Direct Bank Payout</p>
                </div>
              </div>

              {supplierSuccess && (
                <div className="flex items-center gap-2 bg-[#038D63]/10 border border-[#038D63]/30 text-[#038D63] text-sm font-medium p-3 rounded-md">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{supplierSuccess}</span>
                </div>
              )}

              {supplierError && (
                <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-3 rounded-md">
                  <span>{supplierError}</span>
                  {!authUser && (
                    <button
                      type="button"
                      onClick={() => onOpenAuth('supplier')}
                      className="px-3 py-1 bg-[#9F2089] text-white font-bold rounded cursor-pointer whitespace-nowrap"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handlePublish} className="space-y-3.5">
                <p className="text-sm font-bold text-[#353543]">
                  Quick List a Product to Meesho Storefront
                </p>
                <div>
                  <label className="block text-xs font-semibold text-[#616173] mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierTitle}
                    onChange={(e) => setSupplierTitle(e.target.value)}
                    placeholder="e.g., Festive Bandhani Georgette Saree with Golden Lace"
                    className="w-full border border-[#EAEAEF] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#616173] mb-1">
                      Category
                    </label>
                    <select
                      value={supplierCategory}
                      onChange={(e) =>
                        setSupplierCategory(e.target.value as CategoryId)
                      }
                      className="w-full border border-[#EAEAEF] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#9F2089]"
                    >
                      {CATEGORY_NAV_GROUPS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#616173] mb-1">
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      min={99}
                      value={supplierPrice}
                      onChange={(e) => setSupplierPrice(e.target.value)}
                      className="w-full border border-[#EAEAEF] rounded-md px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-[#9F2089]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#616173] mb-1">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      min={149}
                      value={supplierMrp}
                      onChange={(e) => setSupplierMrp(e.target.value)}
                      className="w-full border border-[#EAEAEF] rounded-md px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-[#9F2089]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#616173] mb-1">
                      Supplier / Store Name
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full border border-[#EAEAEF] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#9F2089]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#616173] mb-1">
                      Dispatch City
                    </label>
                    <input
                      type="text"
                      value={supplierCity}
                      onChange={(e) => setSupplierCity(e.target.value)}
                      className="w-full border border-[#EAEAEF] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#9F2089]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#9F2089] hover:bg-[#831871] text-white font-bold text-sm rounded-md cursor-pointer"
                >
                  Publish Product Live
                </button>
              </form>
            </div>
          )}

          {/* PROFILE */}
          {activeOverlay === 'profile' && (
            <div className="space-y-4">
              {!authUser ? (
                <div className="border border-[#EAEAEF] rounded-lg p-6 text-center space-y-3 bg-[#F8F8FA]">
                  <Phone className="w-9 h-9 text-[#9F2089] mx-auto" />
                  <p className="text-base font-bold text-[#353543]">
                    Sign In with Mobile Number or Email
                  </p>
                  <p className="text-sm text-[#616173]">
                    Track your orders, manage saved addresses, and access your Meesho
                    profile.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('profile')}
                    className="px-6 py-2.5 bg-[#9F2089] hover:bg-[#831871] text-white text-sm font-bold rounded-md cursor-pointer"
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              ) : (
                <>
                  <div className="border border-[#EAEAEF] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 bg-[#F8F8FA]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#9F2089] text-white font-bold text-lg flex items-center justify-center">
                        {authUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#353543]">
                          {authUser.name}
                        </p>
                        <p className="text-xs text-[#616173] tabular-nums">
                          {authUser.phone ? `+91 ${authUser.phone}` : authUser.email}
                          {authUser.role === 'admin' ? ' · Admin Account' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {authUser.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => onSwitchOverlay('admin')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#9F2089] hover:bg-[#831871] text-white text-xs font-bold rounded-md cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Open Admin Panel</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onLogout}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#EAEAEF] bg-white hover:bg-red-50 hover:text-red-600 text-xs font-semibold rounded-md cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-[#EAEAEF] rounded-lg p-4">
                      <p className="text-xs text-[#616173]">Orders Placed</p>
                      <p className="text-xl font-bold text-[#353543] tabular-nums mt-1">
                        {orders.length}
                      </p>
                    </div>
                    <div className="border border-[#EAEAEF] rounded-lg p-4">
                      <p className="text-xs text-[#616173]">Reseller Margin Earned</p>
                      <p className="text-xl font-bold text-[#038D63] tabular-nums mt-1">
                        ₹{totalResellerEarnings}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="border border-[#EAEAEF] rounded-lg p-4 space-y-1.5">
                <p className="text-sm font-bold text-[#353543] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#9F2089]" />
                  <span>Default Delivery Address</span>
                </p>
                <p className="text-sm text-[#616173]">
                  {address.houseNo}, {address.streetArea}, {address.city}, {address.state} -{' '}
                  {address.pincode}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
