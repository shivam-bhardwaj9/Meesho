import React, { useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORY_NAV_GROUPS } from '../data/catalog';
import {
  CategoryId,
  FilterState,
  GenderFilter,
  PriceBracket,
  SortOption,
} from '../types/meesho';

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  totalMatching: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const GENDER_OPTIONS: GenderFilter[] = ['Boys', 'Girls', 'Men', 'Women'];

const FABRIC_OPTIONS = ['Cotton', 'Silk', 'Georgette', 'Rayon', 'Fleece', 'Leather'];

const SIZE_OPTIONS = ['Free Size', 'S', 'M', 'L', 'XL', 'XXL'];

const PRICE_OPTIONS: { id: PriceBracket; label: string }[] = [
  { id: 'all', label: 'All Prices' },
  { id: 'under_299', label: 'Under ₹299' },
  { id: 'under_499', label: 'Under ₹499' },
  { id: 'under_799', label: 'Under ₹799' },
  { id: 'above_800', label: '₹800 & Above' },
];

const RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'All Ratings' },
  { value: 4.0, label: '4.0 ★ & above' },
  { value: 3.5, label: '3.5 ★ & above' },
];

const DISCOUNT_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'All Discounts' },
  { value: 10, label: '10% And Above' },
  { value: 30, label: '30% And Above' },
  { value: 50, label: '50% And Above' },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
  totalMatching,
  mobileOpen,
  onCloseMobile,
}) => {
  const [categorySearch, setCategorySearch] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [openSections, setOpenSections] = useState({
    category: true,
    gender: true,
    fabric: false,
    size: false,
    price: false,
    rating: false,
    discount: false,
    delivery: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategory = (cat: CategoryId) => {
    const exists = filters.selectedCategories.includes(cat);
    const updated = exists
      ? filters.selectedCategories.filter((c) => c !== cat)
      : [...filters.selectedCategories, cat];
    onChange({ ...filters, selectedCategories: updated, subCategory: null });
  };

  const toggleGender = (g: GenderFilter) => {
    const exists = filters.selectedGenders.includes(g);
    const updated = exists
      ? filters.selectedGenders.filter((x) => x !== g)
      : [...filters.selectedGenders, g];
    onChange({ ...filters, selectedGenders: updated });
  };

  const toggleFabric = (fabric: string) => {
    const exists = filters.selectedFabrics.includes(fabric);
    const updated = exists
      ? filters.selectedFabrics.filter((f) => f !== fabric)
      : [...filters.selectedFabrics, fabric];
    onChange({ ...filters, selectedFabrics: updated });
  };

  const toggleSize = (size: string) => {
    const exists = filters.selectedSizes.includes(size);
    const updated = exists
      ? filters.selectedSizes.filter((s) => s !== size)
      : [...filters.selectedSizes, size];
    onChange({ ...filters, selectedSizes: updated });
  };

  const filteredCategoryGroups = CATEGORY_NAV_GROUPS.filter((group) =>
    group.label.toLowerCase().includes(categorySearch.trim().toLowerCase())
  );
  const visibleCategoryGroups =
    categorySearch.trim() || showAllCategories
      ? filteredCategoryGroups
      : filteredCategoryGroups.slice(0, 8);

  const activeFilterCount =
    filters.selectedCategories.length +
    filters.selectedGenders.length +
    filters.selectedFabrics.length +
    filters.selectedSizes.length +
    (filters.subCategory ? 1 : 0) +
    (filters.priceBracket !== 'all' ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minDiscount > 0 ? 1 : 0) +
    (filters.freeDeliveryOnly ? 1 : 0) +
    (filters.codOnly ? 1 : 0) +
    (filters.mallOrTrustedOnly ? 1 : 0);

  const sidebarContent = (
    <div className="space-y-4">
      {/* Sort By */}
      <div className="bg-white border border-[#EAEAEF] rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-2">
        <label
          htmlFor="meesho-sort-select"
          className="text-xs font-medium text-[#616173] whitespace-nowrap"
        >
          Sort by :
        </label>
        <select
          id="meesho-sort-select"
          value={filters.sortBy}
          onChange={(e) =>
            onChange({ ...filters, sortBy: e.target.value as SortOption })
          }
          className="flex-1 text-sm font-semibold text-[#353543] bg-transparent focus:outline-none cursor-pointer"
        >
          <option value="relevance">Relevance</option>
          <option value="new_arrivals">New Arrivals</option>
          <option value="price_low_high">Price (Low to High)</option>
          <option value="price_high_low">Price (High to Low)</option>
          <option value="rating">Ratings</option>
        </select>
      </div>

      {/* Filters Panel */}
      <div className="bg-white border border-[#EAEAEF] rounded-lg divide-y divide-[#EAEAEF]">
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#353543] flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#9F2089]" />
              <span>FILTERS</span>
            </p>
            <p className="text-xs text-[#8B8BA3] mt-0.5 tabular-nums">
              {totalMatching} Products
            </p>
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-[#9F2089] hover:text-[#831871] cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Category Filter with Search */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[#353543] cursor-pointer"
          >
            <span>Category</span>
            <ChevronDown
              className={`w-4 h-4 text-[#616173] transition-transform ${
                openSections.category ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.category && (
            <div className="mt-3 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8B8BA3] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search"
                  className="w-full text-xs border border-[#EAEAEF] rounded-md pl-8 pr-2.5 py-1.5 bg-[#F8F8FA] focus:bg-white focus:outline-none focus:border-[#9F2089]"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto meesho-scroll pr-1">
                {visibleCategoryGroups.map((group) => {
                  const checked = filters.selectedCategories.includes(group.id);
                  return (
                    <label
                      key={group.id}
                      className="flex items-center gap-2.5 text-sm text-[#616173] cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(group.id)}
                        className="w-4 h-4 accent-[#9F2089] rounded border-[#8B8BA3] cursor-pointer"
                      />
                      <span className={checked ? 'font-semibold text-[#9F2089]' : ''}>
                        {group.label}
                      </span>
                    </label>
                  );
                })}
                {visibleCategoryGroups.length === 0 && (
                  <p className="text-xs text-[#8B8BA3]">No matching categories</p>
                )}
              </div>

              {!categorySearch.trim() && filteredCategoryGroups.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="text-xs font-semibold text-[#9F2089] hover:underline cursor-pointer"
                >
                  {showAllCategories ? 'Show Less' : 'Show More'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Gender Segmented Filter */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('gender')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[#353543] cursor-pointer"
          >
            <span>Gender</span>
            <ChevronDown
              className={`w-4 h-4 text-[#616173] transition-transform ${
                openSections.gender ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.gender && (
            <div className="mt-3 flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => {
                const active = filters.selectedGenders.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGender(g)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#9F2089]/10 border-[#9F2089] text-[#9F2089]'
                        : 'bg-white border-[#EAEAEF] text-[#616173] hover:border-[#9F2089]/40'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fabric Filter */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('fabric')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[#353543] cursor-pointer"
          >
            <span>Fabric</span>
            <ChevronDown
              className={`w-4 h-4 text-[#616173] transition-transform ${
                openSections.fabric ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.fabric && (
            <div className="mt-3 flex flex-wrap gap-2">
              {FABRIC_OPTIONS.map((f) => {
                const active = filters.selectedFabrics.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFabric(f)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#9F2089]/10 border-[#9F2089] text-[#9F2089] font-semibold'
                        : 'bg-white border-[#EAEAEF] text-[#616173] hover:border-[#9F2089]/40'
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Size Filter */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('size')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[#353543] cursor-pointer"
          >
            <span>Size</span>
            <ChevronDown
              className={`w-4 h-4 text-[#616173] transition-transform ${
                openSections.size ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.size && (
            <div className="mt-3 flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((sz) => {
                const active = filters.selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#9F2089]/10 border-[#9F2089] text-[#9F2089] font-semibold'
                        : 'bg-white border-[#EAEAEF] text-[#616173] hover:border-[#9F2089]/40'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Price Filter */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[#353543] cursor-pointer"
          >
            <span>Price</span>
            <ChevronDown
              className={`w-4 h-4 text-[#616173] transition-transform ${
                openSections.price ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.price && (
            <div className="mt-3 space-y-2">
              {PRICE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2.5 text-sm text-[#616173] cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="price-bracket"
                    checked={filters.priceBracket === opt.id}
                    onChange={() => onChange({ ...filters, priceBracket: opt.id })}
                    className="w-4 h-4 accent-[#9F2089] cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[#353543] cursor-pointer"
          >
            <span>Rating</span>
            <ChevronDown
              className={`w-4 h-4 text-[#616173] transition-transform ${
                openSections.rating ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.rating && (
            <div className="mt-3 space-y-2">
              {RATING_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 text-sm text-[#616173] cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="min-rating"
                    checked={filters.minRating === opt.value}
                    onChange={() => onChange({ ...filters, minRating: opt.value })}
                    className="w-4 h-4 accent-[#9F2089] cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Discount Filter */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('discount')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[#353543] cursor-pointer"
          >
            <span>Discount</span>
            <ChevronDown
              className={`w-4 h-4 text-[#616173] transition-transform ${
                openSections.discount ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.discount && (
            <div className="mt-3 space-y-2">
              {DISCOUNT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 text-sm text-[#616173] cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="min-discount"
                    checked={filters.minDiscount === opt.value}
                    onChange={() => onChange({ ...filters, minDiscount: opt.value })}
                    className="w-4 h-4 accent-[#9F2089] cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Meesho Mall & Delivery */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('delivery')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[#353543] cursor-pointer"
          >
            <span>Meesho Mall &amp; Delivery</span>
            <ChevronDown
              className={`w-4 h-4 text-[#616173] transition-transform ${
                openSections.delivery ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.delivery && (
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2.5 text-sm text-[#616173] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.mallOrTrustedOnly}
                  onChange={(e) =>
                    onChange({ ...filters, mallOrTrustedOnly: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#9F2089] rounded cursor-pointer"
                />
                <span>Meesho Mall / mTrusted</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm text-[#616173] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.freeDeliveryOnly}
                  onChange={(e) =>
                    onChange({ ...filters, freeDeliveryOnly: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#9F2089] rounded cursor-pointer"
                />
                <span>Free Delivery</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm text-[#616173] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.codOnly}
                  onChange={(e) =>
                    onChange({ ...filters, codOnly: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#9F2089] rounded cursor-pointer"
                />
                <span>Cash on Delivery</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-[265px] shrink-0">
        <div className="sticky top-[132px]">{sidebarContent}</div>
      </aside>

      {/* Mobile Slide-Over Filter Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-[320px] bg-[#F8F8FA] h-full overflow-y-auto p-4 z-10">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EAEAEF]">
              <h3 className="text-base font-bold text-[#353543]">Sort &amp; Filters</h3>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-md text-[#616173] hover:text-[#353543]"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
            <div className="mt-4 pt-3 border-t border-[#EAEAEF]">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-2.5 bg-[#9F2089] text-white font-semibold text-sm rounded-md"
              >
                Show {totalMatching} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
