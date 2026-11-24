import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Package,
  Store,
  X,
  Menu,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { CATEGORY_NAV_GROUPS } from '../data/catalog';
import { ActiveOverlay, AuthUser, CategoryId, Product } from '../types/meesho';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategories: CategoryId[];
  onSelectCategory: (cat: CategoryId | null, subCategory?: string | null) => void;
  cartCount: number;
  wishlistCount: number;
  ordersCount: number;
  onOpenOverlay: (overlay: ActiveOverlay) => void;
  onOpenAuth: (source?: 'profile' | 'cart' | 'supplier') => void;
  isAuthPage?: boolean;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  authUser: AuthUser | null;
}

const POPULAR_SEARCHES = [
  'Silk Saree',
  'Georgette Saree',
  'Anarkali Kurti',
  'Men Hoodie',
  'Kundan Choker',
  'Smartwatch',
  'Bedsheet',
];

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onSelectCategory,
  cartCount,
  wishlistCount,
  ordersCount,
  onOpenOverlay,
  onOpenAuth,
  isAuthPage = false,
  products,
  onSelectProduct,
  authUser,
}) => {
  const [hoveredCat, setHoveredCat] = useState<CategoryId | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [investorOpen, setInvestorOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const instantMatches = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const activeHoveredGroup = CATEGORY_NAV_GROUPS.find((g) => g.id === hoveredCat) || null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#EAEAEF]">
      {/* Primary Top Bar */}
      <div className="max-w-[1360px] mx-auto px-4 lg:px-6 h-16 md:h-[72px] flex items-center justify-between gap-4 lg:gap-6">
        {/* Left: Brand Wordmark + Search */}
        <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
          {!isAuthPage && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 -ml-2 text-[#353543] hover:text-[#9F2089] rounded-lg"
              aria-label="Toggle category menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onSelectCategory(null, null);
              onOpenOverlay(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-[#9F2089] leading-none whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#9F2089] rounded"
          >
            meesho
          </button>

          {/* Desktop Search Bar */}
          <div ref={searchBoxRef} className="relative hidden md:block flex-1 max-w-[440px]">
            <div className="flex items-center border border-[#8B8BA3]/45 focus-within:border-[#9F2089] rounded-md bg-white px-3.5 h-11 transition-colors">
              <Search className="w-4 h-4 text-[#8B8BA3] shrink-0 mr-2.5" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Try Saree, Kurti or Search by Product Code"
                className="w-full text-sm text-[#353543] placeholder:text-[#8B8BA3] focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1 text-[#8B8BA3] hover:text-[#353543]"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Instant Search Dropdown */}
            {searchFocused && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#EAEAEF] rounded-lg shadow-xl z-50 overflow-hidden">
                {searchQuery.trim() === '' ? (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-[#616173] mb-2.5">Popular Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            onSearchChange(term);
                            setSearchFocused(false);
                            document
                              .getElementById('products-for-you')
                              ?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-[#353543] bg-[#F8F8FA] hover:bg-[#9F2089]/10 hover:text-[#9F2089] border border-[#EAEAEF] rounded-md transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : instantMatches.length > 0 ? (
                  <div className="divide-y divide-[#EAEAEF]">
                    {instantMatches.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          onSelectProduct(item);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-[#F8F8FA] text-left transition-colors cursor-pointer"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-12 object-cover rounded border border-[#EAEAEF] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#353543] truncate">{item.title}</p>
                          <p className="text-xs text-[#616173] tabular-nums">
                            {item.category} · ₹{item.price}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-[#616173]">
                    No exact matches for &ldquo;{searchQuery}&rdquo;. Try Saree, Kurti, or Earbuds.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Meesho Navigation Actions */}
        <nav className="flex items-center gap-1.5 sm:gap-2 lg:gap-3.5 shrink-0">
          {!isAuthPage && <PWAInstallButton />}

          {authUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => onOpenOverlay('admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9F2089] hover:bg-[#831871] text-white text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenOverlay('supplier')}
            className="hidden xl:flex items-center gap-1.5 text-sm font-medium text-[#353543] hover:text-[#9F2089] py-2 px-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>Become a Supplier</span>
          </button>

          <div className="hidden xl:block h-6 w-px bg-[#EAEAEF]" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setInvestorOpen(true)}
            className="hidden xl:flex items-center text-sm font-medium text-[#353543] hover:text-[#9F2089] py-2 px-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Investor Relations</span>
          </button>

          {!isAuthPage && (
            <>
              <div className="hidden xl:block h-6 w-px bg-[#EAEAEF]" aria-hidden="true" />

              <button
                type="button"
                onClick={() => onOpenOverlay('orders')}
                className="hidden sm:flex flex-col items-center justify-center px-2 py-1 text-[#353543] hover:text-[#9F2089] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <div className="relative">
                  <Package className="w-[18px] h-[18px]" />
                  {ordersCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#9F2089] text-white text-[10px] font-bold px-1 rounded-full leading-tight tabular-nums">
                      {ordersCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium mt-0.5">Orders</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenOverlay('wishlist')}
                className="flex flex-col items-center justify-center px-2 py-1 text-[#353543] hover:text-[#9F2089] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                aria-label="Wishlist"
              >
                <div className="relative">
                  <Heart className="w-[18px] h-[18px]" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#F43397] text-white text-[10px] font-bold px-1 rounded-full leading-tight tabular-nums">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-medium mt-0.5">Wishlist</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (authUser) {
                    onOpenOverlay('profile');
                  } else {
                    onOpenAuth('profile');
                  }
                }}
                className="flex flex-col items-center justify-center px-2 py-1 text-[#353543] hover:text-[#9F2089] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                aria-label={authUser ? 'Profile' : 'Sign In'}
              >
                <User className="w-[18px] h-[18px]" />
                <span className="text-xs font-medium mt-0.5 max-w-[78px] truncate">
                  {authUser ? authUser.name.split(' ')[0] : 'Sign In'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onOpenOverlay('cart')}
                className="flex flex-col items-center justify-center px-2 py-1 text-[#353543] hover:text-[#9F2089] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                aria-label="Shopping Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-[18px] h-[18px]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#9F2089] text-white text-[10px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full tabular-nums">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-medium mt-0.5">Cart</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Mobile Search Bar */}
      {!isAuthPage && (
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center border border-[#8B8BA3]/45 focus-within:border-[#9F2089] rounded-md bg-white px-3 h-10">
            <Search className="w-4 h-4 text-[#8B8BA3] shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Saree, Kurti, Earbuds..."
              className="w-full text-sm text-[#353543] placeholder:text-[#8B8BA3] focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-1 text-[#8B8BA3]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Category Mega-Menu Strip */}
      {!isAuthPage && (
        <div
          className="hidden lg:block border-t border-[#EAEAEF] bg-white relative"
          onMouseLeave={() => setHoveredCat(null)}
        >
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onMouseEnter={() => setHoveredCat(null)}
            onClick={() => {
              onSelectCategory(null, null);
              setHoveredCat(null);
              document
                .getElementById('products-for-you')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`py-3 px-1.5 text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap shrink-0 border-b-[3px] transition-colors cursor-pointer ${
              selectedCategories.length === 0 && hoveredCat === null
                ? 'text-[#9F2089] border-[#9F2089]'
                : 'text-[#353543] border-transparent hover:text-[#9F2089]'
            }`}
          >
            Popular
          </button>
          {CATEGORY_NAV_GROUPS.map((group) => {
            const isActive =
              selectedCategories.includes(group.id) || hoveredCat === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onMouseEnter={() => setHoveredCat(group.id)}
                onClick={() => {
                  onSelectCategory(group.id, null);
                  setHoveredCat(null);
                  document
                    .getElementById('products-for-you')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`py-3 px-1.5 text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap shrink-0 border-b-[3px] transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#9F2089] border-[#9F2089]'
                    : 'text-[#353543] border-transparent hover:text-[#9F2089]'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        {/* Mega Menu Dropdown */}
        {activeHoveredGroup && (
          <div className="absolute left-0 right-0 top-full bg-white border-t border-b border-[#EAEAEF] shadow-lg z-50">
            <div className="max-w-[1360px] mx-auto px-6 py-5 flex gap-12">
              {activeHoveredGroup.columns.map((col, idx) => (
                <div
                  key={col.heading}
                  className={`min-w-[180px] ${
                    idx % 2 === 1 ? 'bg-[#F8F8FA] -my-5 py-5 px-5' : ''
                  }`}
                >
                  <p className="text-sm font-semibold text-[#9F2089] mb-3">{col.heading}</p>
                  <ul className="space-y-2">
                    {col.items.map((subItem) => (
                      <li key={subItem}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCategory(activeHoveredGroup.id, subItem);
                            setHoveredCat(null);
                            document
                              .getElementById('products-for-you')
                              ?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-sm text-[#616173] hover:text-[#353543] hover:font-medium transition-colors text-left cursor-pointer"
                        >
                          {subItem}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {!isAuthPage && mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#EAEAEF] bg-white px-4 py-4 space-y-2 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EAEAEF]">
            <button
              type="button"
              onClick={() => {
                onOpenOverlay('orders');
                setMobileMenuOpen(false);
              }}
              className="text-sm font-semibold text-[#353543] flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-[#9F2089]" />
              My Orders ({ordersCount})
            </button>
            {authUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  onOpenOverlay('admin');
                  setMobileMenuOpen(false);
                }}
                className="text-sm font-bold text-[#9F2089] flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Panel
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onOpenOverlay('supplier');
                setMobileMenuOpen(false);
              }}
              className="text-sm font-semibold text-[#9F2089] flex items-center gap-1.5"
            >
              <Store className="w-4 h-4" />
              Become a Supplier
            </button>
          </div>
          <p className="text-xs font-semibold text-[#616173] pt-1">Shop by Category</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_NAV_GROUPS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id, null);
                  setMobileMenuOpen(false);
                  document
                    .getElementById('products-for-you')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-between text-left text-sm font-medium text-[#353543] bg-[#F8F8FA] px-3 py-2.5 rounded-md border border-[#EAEAEF]"
              >
                <span className="truncate">{cat.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B8BA3] -rotate-90 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Investor Relations Info Modal */}
      {investorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="bg-white w-full max-w-[520px] rounded-xl border border-[#EAEAEF] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EAEAEF] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#353543]">
                Meesho Investor Relations
              </h3>
              <button
                type="button"
                onClick={() => setInvestorOpen(false)}
                className="p-1.5 rounded-full text-[#616173] hover:bg-[#F8F8FA] cursor-pointer"
                aria-label="Close Investor Relations"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm text-[#616173]">
              <p className="leading-relaxed">
                Fashnear Technologies Private Limited operates Meesho, India&apos;s
                zero-commission marketplace connecting millions of small businesses and
                value-conscious shoppers across 28,000+ pincodes.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center bg-[#F8F8FA] border border-[#EAEAEF] rounded-lg p-3.5">
                <div>
                  <p className="text-base font-extrabold text-[#9F2089] tabular-nums">14 Cr+</p>
                  <p className="text-[11px] text-[#616173]">Annual Transacting Users</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-[#9F2089] tabular-nums">0%</p>
                  <p className="text-[11px] text-[#616173]">Seller Commission</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-[#9F2089] tabular-nums">28,000+</p>
                  <p className="text-[11px] text-[#616173]">Serviceable Pincodes</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setInvestorOpen(false)}
                  className="px-4 py-2 bg-[#9F2089] hover:bg-[#831871] text-white text-xs font-bold rounded-md cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
