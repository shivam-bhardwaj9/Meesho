import React from 'react';
import { RotateCcw, Banknote, Tag } from 'lucide-react';
import { CategoryId } from '../types/meesho';

interface HeroSectionProps {
  onShopNow: () => void;
  onSelectCategory: (cat: CategoryId) => void;
}

const ARCH_CATEGORIES: {
  label: string;
  category: CategoryId;
  image: string;
}[] = [
  {
    label: 'Ethnic Wear',
    category: 'Women Ethnic',
    image: '/assets/aistudio/1744634654837_98bcbcc1.webp',
  },
  {
    label: 'Western Dresses',
    category: 'Women Western',
    image: '/assets/aistudio/1744634725496_490b5114.webp',
  },
  {
    label: 'Menswear',
    category: 'Men',
    image: '/assets/aistudio/1744634780426_fb82ebe5.webp',
  },
  {
    label: 'Footwear',
    category: 'Bags & Footwear',
    image: '/assets/aistudio/1744634814643_fed313b0.webp',
  },
  {
    label: 'Home Decor',
    category: 'Home & Kitchen',
    image: '/assets/aistudio/1744634835018_42f939d2.webp',
  },
  {
    label: 'Beauty',
    category: 'Beauty & Health',
    image: '/assets/aistudio/1744634871107_08ea959d.webp',
  },
  {
    label: 'Accessories',
    category: 'Jewellery & Accessories',
    image: '/assets/aistudio/1744634909968_c1cc715f.webp',
  },
  {
    label: 'Grocery',
    category: 'Grocery',
    image: '/assets/aistudio/1744634937295_147517fb.webp',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onShopNow,
  onSelectCategory,
}) => {
  return (
    <section className="w-full bg-white">
      {/* Full-Width Meesho Purple/Magenta Hero Banner */}
      <div className="relative overflow-hidden bg-[#8D1C7F]">
        <img
          src="/assets/aistudio/1787227877932_f5ecedc0.webp"
          alt="Upto 35% OFF on your first order — Scan QR code to install Meesho App"
          referrerPolicy="no-referrer"
          className="w-full h-[220px] sm:h-[300px] lg:h-[380px] object-cover object-left"
        />
        <div className="lg:absolute lg:inset-0 flex items-center bg-[#9F2089] lg:bg-transparent py-5 lg:py-0">
          <div className="max-w-[1360px] w-full mx-auto px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-start-9 lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left">
              <h1
                className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-white leading-[1.2] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Smart Shopping
                <br />
                Trusted by Millions
              </h1>

              <button
                type="button"
                onClick={onShopNow}
                className="mt-5 px-9 py-3 bg-white hover:bg-[#F8F8FA] text-[#353543] font-bold text-base rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pink-Bordered 3-Point Value Strip */}
      <div className="max-w-[1360px] mx-auto px-4 lg:px-6 pt-4">
        <div className="border border-[#F43397]/25 bg-white rounded-lg py-2.5 px-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-[#353543]">
          <span className="inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#9F2089]" />
            <span>7 Days Easy Return</span>
          </span>
          <span className="hidden sm:inline text-[#EAEAEF]" aria-hidden="true">
            |
          </span>
          <span className="inline-flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[#9F2089]" />
            <span>Cash on Delivery</span>
          </span>
          <span className="hidden sm:inline text-[#EAEAEF]" aria-hidden="true">
            |
          </span>
          <span className="inline-flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#9F2089]" />
            <span>Lowest Prices</span>
          </span>
        </div>
      </div>

      {/* 8-Column Quick Category Arch Row */}
      <div className="max-w-[1360px] mx-auto px-4 lg:px-6 pt-6 pb-4">
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {ARCH_CATEGORIES.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                onSelectCategory(item.category);
                document
                  .getElementById('products-for-you')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group flex flex-col items-center text-center cursor-pointer"
            >
              <div className="w-full aspect-square max-w-[136px] flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <span className="mt-2 text-xs sm:text-[13px] font-semibold text-[#353543] group-hover:text-[#9F2089] leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
