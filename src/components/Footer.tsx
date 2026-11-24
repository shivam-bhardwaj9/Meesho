import React, { useState } from 'react';
import { ChevronDown, Store } from 'lucide-react';
import { CategoryId } from '../types/meesho';

interface FooterProps {
  onSelectCategory: (cat: CategoryId) => void;
  onBecomeSupplier: () => void;
}

const ONLINE_SHOPPING_SECTIONS: {
  heading: string;
  category: CategoryId;
  items: string[];
}[] = [
  {
    heading: 'Baby',
    category: 'Kids',
    items: ['Baby Blanket', 'Baby Hanging Cradle', 'Baby Pillows', 'Baby Sleeping Bag', 'Baby Towels'],
  },
  {
    heading: 'Electronics & Accessories',
    category: 'Electronics',
    items: ['Bluetooth Earphones', 'Bluetooth Speakers', 'Data Cables', 'Mobile Chargers', 'Fast Charging Power Banks', 'Headphones'],
  },
  {
    heading: 'Home & Kitchen',
    category: 'Home & Kitchen',
    items: ['Choppers', 'Cookers', 'Cutlery', 'Dinnerware', 'Jars & Container', 'Lunch Boxes', 'Mixer Grinder', 'Water Bottles'],
  },
  {
    heading: 'Home & Living',
    category: 'Home & Kitchen',
    items: ['Bean Bags', 'Bedding Sets', 'Blankets', 'Cotton Bedsheets', 'Curtains & Sheers', 'Cushions', 'Pillow Covers'],
  },
  {
    heading: 'Kids',
    category: 'Kids',
    items: ['Girls Stylish Tops', 'Kids Ethnic Gowns', 'Kids Kurtis & Kurtas', 'Kids Salwar Suit Sets', 'Rompers', 'Tshirts Boys'],
  },
  {
    heading: 'Men Accessories & Ethnicwear',
    category: 'Men',
    items: ['Leather Watches Men', 'Men Dhoti Kurtas', 'Men Velvet Sherwanis', 'Men Sandals', 'Men Sports Shoes'],
  },
  {
    heading: 'Men Western Wear',
    category: 'Men',
    items: ['Cotton Shorts Men', 'Denim Jeans Men', 'Formal Shirts Men', 'Formal Trousers Men', 'Leather Jackets Men', 'Printed Tshirts'],
  },
  {
    heading: 'Personal Care & Wellness',
    category: 'Beauty & Health',
    items: ['Sunscreen', 'BB Cream', 'Beard Oil', 'Body Scrub', 'Deodorants', 'Face Oil & Serum', 'Hair Care', 'Makeup Kits'],
  },
  {
    heading: 'Women Accessories',
    category: 'Jewellery & Accessories',
    items: ['Chandbali Earrings', 'Handbags', 'Jewellery Set', 'Maangtika', 'Nosepins', 'Oxidised Ring', 'Trolley Bags'],
  },
  {
    heading: 'Women Ethnicwear',
    category: 'Women Ethnic',
    items: ['Anarkali Kurtis', 'Blouse Piece', 'Chikankari Kurtis', 'Designer Lehenga', 'Dupatta Sets', 'Sharara', 'Silk Saree'],
  },
  {
    heading: 'Women Footwear & Western Wear',
    category: 'Women Western',
    items: ['Bellies', 'Juttis & Mojaris', 'Dresses', 'Flared Jeans', 'Chikankari Palazzos', 'Kaftans', 'Women Jackets'],
  },
];

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onBecomeSupplier,
}) => {
  const [moreAboutOpen, setMoreAboutOpen] = useState(true);

  const handleCatClick = (cat: CategoryId) => {
    onSelectCategory(cat);
    document.getElementById('products-for-you')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#F8F8FA] border-t border-[#EAEAEF] mt-12">
      <div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-3">
            <p className="text-2xl font-extrabold text-[#9F2089] tracking-tight">
              meesho
            </p>
            <h3 className="text-lg font-bold text-[#353543]">
              Shop Non-Stop on Meesho
            </h3>
            <p className="text-sm text-[#616173] leading-relaxed">
              Trusted by crores of Indians. Cash on Delivery, Free Delivery, and
              Easy 7-Day Returns across 28,000+ pincodes.
            </p>
            <button
              type="button"
              onClick={onBecomeSupplier}
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-[#9F2089] hover:bg-[#831871] text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Start Selling at 0% Commission</span>
            </button>
          </div>

          {/* Categories Links */}
          <div className="lg:col-span-3 space-y-2.5">
            <p className="text-sm font-bold text-[#353543]">Shop Categories</p>
            <ul className="space-y-1.5 text-sm text-[#616173]">
              {(
                [
                  'Women Ethnic',
                  'Women Western',
                  'Men',
                  'Kids',
                  'Home & Kitchen',
                  'Beauty & Health',
                  'Jewellery & Accessories',
                  'Electronics',
                ] as CategoryId[]
              ).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => handleCatClick(cat)}
                    className="hover:text-[#9F2089] transition-colors cursor-pointer"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies & Help */}
          <div className="lg:col-span-2 space-y-2.5">
            <p className="text-sm font-bold text-[#353543]">Legal &amp; Policies</p>
            <ul className="space-y-1.5 text-sm text-[#616173]">
              <li>Terms &amp; Conditions</li>
              <li>Privacy Policy</li>
              <li>Return &amp; Refund Policy</li>
              <li>Anti-Phishing Policy</li>
              <li>Meesho Hall of Fame</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3 space-y-2">
            <p className="text-sm font-bold text-[#353543]">Contact Us</p>
            <p className="text-xs text-[#616173] leading-relaxed">
              Fashnear Technologies Private Limited,
              <br />
              3rd Floor, Wing-E, Helios Business Park,
              <br />
              Kadubeesanahalli Village, Outer Ring Road,
              <br />
              Bengaluru, Karnataka - 560103
            </p>
            <p className="text-xs text-[#616173] pt-1">
              Support: query@meesho.com
            </p>
          </div>
        </div>

        {/* Collapsible More About Meesho Accordion */}
        <div className="mt-8 bg-white border border-[#EAEAEF] rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setMoreAboutOpen((v) => !v)}
            className="w-full px-5 py-4 flex items-center justify-between text-left text-sm sm:text-base font-bold text-[#353543] hover:text-[#9F2089] transition-colors cursor-pointer"
          >
            <span>More About Meesho</span>
            <ChevronDown
              className={`w-4 h-4 text-[#616173] transition-transform ${
                moreAboutOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {moreAboutOpen && (
            <div className="px-5 pb-6 pt-3 border-t border-[#EAEAEF] space-y-4 text-xs text-[#616173] leading-relaxed">
              <div>
                <h4 className="text-sm font-bold text-[#353543] mb-1">
                  Discover a World of Affordable Fashion &amp; Everyday Essentials
                </h4>
                <p>
                  Upgrade your wardrobe and stock your home with the latest trends and
                  essentials at prices designed for everyday value. Meesho offers a vast
                  selection of products across all categories, ensuring you find everything you
                  need at prices suited for everyday budgets.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#353543] mb-1">
                  Shop Millions of Products Across All Categories
                </h4>
                <p>
                  From trendy fashion finds to essential homeware, Meesho is your one-stop
                  shop for everything you need. Explore millions of products across a wide
                  variety of categories, ensuring you find the perfect item for any occasion.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#353543] mb-1">
                  Latest Women&apos;s Fashion Is Right Here
                </h4>
                <p>
                  Find trendy dresses, casual jeans, comfortable tops, ethnic sarees, kurtis,
                  dupatta sets, jewelry sets, handbags, and footwear curated for everyday
                  elegance and festive wear.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#353543] mb-1">
                  Largest Collection of Menswear and Accessories
                </h4>
                <p>
                  Upgrade your casual or formal attire with Meesho&apos;s men&apos;s wear
                  collection—T-shirts, jeans, polos, winter jackets, sherwanis, kurta sets,
                  watches, wallets, and sports sneakers.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#353543] mb-1">
                  Top Quality Beauty, Home Decor &amp; Electronics
                </h4>
                <p>
                  Explore dermatologically trusted sunscreens, serums, skincare combos,
                  kitchen storage, cotton bedsheets, fitness accessories, and wireless audio
                  with Cash on Delivery, UPI, and easy 7-day returns.
                </p>
              </div>

              <div className="pt-2 border-t border-[#EAEAEF]">
                <h4 className="text-sm font-bold text-[#353543] mb-3">Online Shopping</h4>
                <div className="space-y-2.5">
                  {ONLINE_SHOPPING_SECTIONS.map((sec) => (
                    <div key={sec.heading}>
                      <p className="font-bold text-[#353543] mb-1">{sec.heading}</p>
                      <div className="flex flex-wrap items-center gap-y-1">
                        {sec.items.map((item, idx) => (
                          <React.Fragment key={item}>
                            <button
                              type="button"
                              onClick={() => handleCatClick(sec.category)}
                              className="text-xs font-medium text-[#9F2089] hover:underline cursor-pointer"
                            >
                              {item}
                            </button>
                            {idx < sec.items.length - 1 && (
                              <span className="mx-2 text-[#D5D5DF]">|</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-[#EAEAEF] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8B8BA3]">
          <p>© {new Date().getFullYear()} Meesho Storefront. All rights reserved.</p>
          <p>Free Delivery · Cash on Delivery · Lowest Prices</p>
        </div>
      </div>
    </footer>
  );
};
