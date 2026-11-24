import React from 'react';
import { BadgeCheck, ChevronRight } from 'lucide-react';
import { PRODUCT_IMAGES } from '../data/catalog';
import { CategoryId, PriceBracket, SortOption } from '../types/meesho';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface CategoryShowcaseProps {
  onPickCategory: (category: CategoryId, subCategory?: string | null) => void;
  onQuickFilter: (opts: {
    priceBracket?: PriceBracket;
    minRating?: number;
    sortBy?: SortOption;
    searchQuery?: string;
    category?: CategoryId;
  }) => void;
}

const GOLD_CATEGORIES: {
  label: string;
  category: CategoryId;
  subCategory?: string;
  image: string;
}[] = [
  {
    label: 'Lehengas',
    category: 'Women Ethnic',
    subCategory: 'All Lehengas',
    image: PRODUCT_IMAGES.kurti,
  },
  {
    label: 'Menwear',
    category: 'Men',
    image: PRODUCT_IMAGES.mensShirt,
  },
  {
    label: 'Sarees',
    category: 'Women Ethnic',
    subCategory: 'Silk Sarees',
    image: PRODUCT_IMAGES.saree,
  },
  {
    label: 'Jewellery',
    category: 'Jewellery & Accessories',
    image: PRODUCT_IMAGES.jewellery,
  },
];

const ORIGINAL_BRANDS_CARDS: {
  label: string;
  category: CategoryId;
  subCategory?: string;
  image: string;
  isFullCard?: boolean;
}[] = [
  {
    label: 'Personal Care',
    category: 'Beauty & Health',
    subCategory: 'Sunscreen',
    image: '/assets/aistudio/1744635542873_49c0fd6e.webp',
    isFullCard: true,
  },
  {
    label: 'Electronics',
    category: 'Electronics',
    image: '/assets/aistudio/1744635521751_98515968.webp',
    isFullCard: true,
  },
  {
    label: 'Makeup',
    category: 'Beauty & Health',
    subCategory: 'Makeup Kits & Combos',
    image: '/assets/aistudio/1744635497001_4f66378e.webp',
    isFullCard: true,
  },
  {
    label: 'Men Perfume',
    category: 'Beauty & Health',
    subCategory: 'Men Perfumes',
    image: '/assets/aistudio/1744635432891_a7b87bef.webp',
    isFullCard: true,
  },
  {
    label: 'Bags',
    category: 'Bags & Footwear',
    subCategory: 'Tote Handbags',
    image: '/assets/aistudio/1744635402151_90f6dbca.webp',
    isFullCard: true,
  },
  {
    label: 'Footwear',
    category: 'Bags & Footwear',
    subCategory: 'Sports Sneakers',
    image: '/assets/aistudio/1744635614888_8af4a40c.webp',
    isFullCard: true,
  },
  {
    label: 'Books',
    category: 'Books',
    image: PRODUCT_IMAGES.bedsheet,
    isFullCard: false,
  },
];

const PARTNER_BRANDS = [
  { name: 'plüm', query: 'Bloom', colorClass: 'text-[#5A2D82]' },
  { name: 'NIVEA', query: 'Serum', colorClass: 'text-[#0032A0]' },
  { name: 'Himalaya', query: 'Cotton', colorClass: 'text-[#007B66]' },
  { name: 'MI', query: 'Earbuds', colorClass: 'text-[#FF6900]' },
  { name: 'Bata', query: 'Sneakers', colorClass: 'text-[#D61F26] italic' },
  { name: 'WOW', query: 'Vitamin', colorClass: 'text-[#222222]' },
  { name: 'mamaearth', query: 'Moisturizer', colorClass: 'text-[#008C45]' },
  { name: 'WILD STONE', query: 'Men', colorClass: 'text-[#1F1F29]' },
];

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  onPickCategory,
  onQuickFilter,
}) => {
  const { isInstallable, install } = usePWAInstall();

  const scrollToGrid = () => {
    document.getElementById('products-for-you')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-6">
      {/* 1. Meesho Gold Editorial Banner */}
      <section className="relative w-full overflow-hidden bg-[#402216]">
        <img
          src="/assets/aistudio/1744698265981_167b5d71.webp"
          alt="Meesho Gold — Products you Love. Quality we Trust."
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-left"
        />
        <div className="relative z-10 max-w-[1360px] mx-auto px-4 lg:px-6 min-h-[340px] sm:min-h-[390px] lg:min-h-[430px] py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 items-end lg:items-center gap-8">
          {/* Left Gold CTA aligned below reference image Gold logo */}
          <div className="lg:col-span-5 pt-44 sm:pt-52 lg:pt-56 flex items-start">
            <button
              type="button"
              onClick={() => {
                onPickCategory('Women Ethnic', null);
                scrollToGrid();
              }}
              className="px-8 py-3 rounded-lg border-2 border-[#E6B873] bg-[#2D170E]/85 text-[#E6B873] hover:bg-[#E6B873] hover:text-[#21110B] font-bold text-sm sm:text-base transition-colors cursor-pointer"
            >
              Shop Now
            </button>
          </div>

          {/* Right 2x2 Gold-Framed Cards matching Meesho Gold */}
          <div className="lg:col-span-7 flex lg:justify-end">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 w-full max-w-[360px]">
              {GOLD_CATEGORIES.map((tile) => (
                <button
                  key={tile.label}
                  type="button"
                  onClick={() => {
                    onPickCategory(tile.category, tile.subCategory || null);
                    scrollToGrid();
                  }}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-full border-2 border-[#C89652] bg-[#361B11] overflow-hidden p-1.5 group-hover:border-[#F4D08A] transition-colors">
                    <img
                      src={tile.image}
                      alt={tile.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <span className="-mt-3 relative z-10 px-4 py-1 rounded-full bg-[#2B150D] border border-[#C89652] text-xs font-bold text-[#F5D69E] group-hover:text-white shadow-sm">
                    {tile.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Original Brands Showcase + Partner Strip */}
      <section className="max-w-[1360px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[#353543] flex items-center gap-2">
            <span>Original Brands</span>
            <BadgeCheck className="w-5 h-5 text-[#5E2CED] fill-[#5E2CED]/15" />
          </h2>
          <button
            type="button"
            onClick={() => {
              onQuickFilter({ sortBy: 'rating' });
              scrollToGrid();
            }}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#9F2089] hover:text-[#831871] cursor-pointer"
          >
            <span>VIEW ALL</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 items-stretch">
          {ORIGINAL_BRANDS_CARDS.map((card) =>
            card.isFullCard ? (
              <button
                key={card.label}
                type="button"
                aria-label={card.label}
                onClick={() => {
                  onPickCategory(card.category, card.subCategory || null);
                  scrollToGrid();
                }}
                className="group rounded-xl overflow-hidden bg-white cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block w-full"
              >
                <img
                  src={card.image}
                  alt={card.label}
                  className="w-full h-full object-cover block group-hover:scale-[1.03] transition-transform duration-200"
                />
              </button>
            ) : (
              <button
                key={card.label}
                type="button"
                onClick={() => {
                  onPickCategory(card.category, card.subCategory || null);
                  scrollToGrid();
                }}
                className="group aspect-[3/4] h-full rounded-xl overflow-hidden border border-[#EAEAEF] bg-[#F1EEFF] flex flex-col justify-between cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex-1 w-full p-2.5 flex items-center justify-center bg-gradient-to-b from-[#F1EEFF] to-white overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="py-2.5 px-2 bg-[#6A1FFF] text-white text-xs sm:text-[15px] font-bold text-center truncate">
                  {card.label}
                </div>
              </button>
            )
          )}
        </div>

        {/* Partner Brand Marquee Strip */}
        <div className="meesho-marquee-wrapper mt-4 bg-[#F6EFF8] border border-[#EAEAEF] rounded-lg py-3.5 overflow-hidden relative">
          <div className="meesho-marquee-track">
            {[...PARTNER_BRANDS, ...PARTNER_BRANDS].map((brand, idx) => (
              <button
                key={`${brand.name}-${idx}`}
                type="button"
                onClick={() => {
                  onQuickFilter({ searchQuery: brand.query });
                  scrollToGrid();
                }}
                className={`mr-3 w-[148px] sm:w-[164px] shrink-0 bg-white border border-[#EAEAEF] hover:border-[#9F2089]/50 rounded-lg py-3 px-4 flex items-center justify-center text-sm sm:text-base font-extrabold tracking-tight hover:text-[#9F2089] transition-colors cursor-pointer shadow-2xs ${brand.colorClass}`}
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Orange App Promo + 4 Curated Collections Banner */}
      <section className="max-w-[1360px] mx-auto px-4 lg:px-6">
        <div className="rounded-xl overflow-hidden bg-gradient-to-r from-[#FF9F1C] via-[#FF7A00] to-[#F25C05] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
          <div className="lg:col-span-5 text-[#3B1700] space-y-3">
            <p className="text-xl sm:text-2xl font-extrabold leading-tight">
              Up to{' '}
              <span className="block text-3xl sm:text-4xl font-black text-white drop-shadow-xs">
                35% OFF
              </span>
              on first order
            </p>
            <p className="text-xs font-bold text-[#3B1700]/80">*Only on App</p>
            <button
              type="button"
              onClick={async () => {
                if (isInstallable) {
                  await install();
                } else {
                  onQuickFilter({ priceBracket: 'under_499' });
                  scrollToGrid();
                }
              }}
              className="mt-2 px-6 py-2.5 bg-white hover:bg-[#FFF8F0] text-[#353543] font-bold text-sm rounded-lg shadow-sm cursor-pointer"
            >
              {isInstallable ? 'Install Web App' : 'Download Now'}
            </button>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Trending Now',
                image: PRODUCT_IMAGES.georgetteSaree,
                action: () => onQuickFilter({ sortBy: 'relevance' }),
              },
              {
                label: 'Budget Buys',
                image: PRODUCT_IMAGES.silverJewellery,
                action: () => onQuickFilter({ priceBracket: 'under_299' }),
              },
              {
                label: 'Top Rated Picks',
                image: PRODUCT_IMAGES.smartwatch,
                action: () => onQuickFilter({ minRating: 4.0, sortBy: 'rating' }),
              },
              {
                label: 'Daily Essentials',
                image: PRODUCT_IMAGES.kitchen,
                action: () => onQuickFilter({ category: 'Home & Kitchen' }),
              },
            ].map((box) => (
              <button
                key={box.label}
                type="button"
                onClick={() => {
                  box.action();
                  scrollToGrid();
                }}
                className="group bg-[#FFB347]/35 border border-white/40 rounded-xl p-2 flex flex-col items-center cursor-pointer hover:bg-white/25 transition-colors"
              >
                <div className="w-full aspect-[4/5] rounded-lg overflow-hidden bg-white">
                  <img
                    src={box.image}
                    alt={box.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <span className="mt-2 w-full py-1 px-2 bg-white text-[#353543] text-xs font-bold rounded text-center truncate">
                  {box.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
