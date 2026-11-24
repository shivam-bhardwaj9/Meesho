import React, { useState } from 'react';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { Product } from '../types/meesho';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onOpenProduct,
  onQuickAdd,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="group bg-white border border-[#EAEAEF] rounded-lg overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image Frame */}
      <div className="relative aspect-[3/4] bg-[#F8F8FA] overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenProduct(product)}
          className="w-full h-full block text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#9F2089]"
        >
          {!imgError ? (
            <img
              src={product.image}
              alt={product.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#F8F8FA] to-[#EAEAEF]">
              <ShoppingBag className="w-8 h-8 text-[#9F2089]/60 mb-2" />
              <span className="text-xs font-medium text-[#616173] line-clamp-2">
                {product.title}
              </span>
            </div>
          )}
        </button>

        {/* Mall Badge top-left */}
        {product.isMall && (
          <span className="absolute top-2.5 left-2.5 bg-[#5E2CED] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs tracking-wide">
            Mall
          </span>
        )}

        {/* +N More indicator bottom-right */}
        {product.moreVariants && product.moreVariants > 0 ? (
          <span className="absolute bottom-2 right-2 bg-white/95 border border-[#EAEAEF] text-[#616173] text-[11px] font-semibold px-2 py-0.5 rounded shadow-2xs sm:group-hover:opacity-0 transition-opacity tabular-nums">
            +{product.moreVariants} More
          </span>
        ) : null}

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 border border-[#EAEAEF] flex items-center justify-center text-[#616173] hover:text-[#F43397] transition-colors cursor-pointer shadow-xs"
        >
          <Heart
            className={`w-4 h-4 ${
              isWishlisted ? 'fill-[#F43397] text-[#F43397]' : 'text-[#616173]'
            }`}
          />
        </button>

        {/* Subtle Quick Add on Desktop Hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(product);
          }}
          className="hidden sm:flex items-center justify-center gap-1.5 absolute inset-x-2.5 bottom-2.5 py-2 bg-white/95 hover:bg-[#9F2089] text-[#353543] hover:text-white border border-[#EAEAEF] rounded-md text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </button>
      </div>

      {/* Product Metadata */}
      <button
        type="button"
        onClick={() => onOpenProduct(product)}
        className="p-3.5 flex-1 flex flex-col justify-between text-left cursor-pointer"
      >
        <div>
          <h3 className="text-[14px] font-medium text-[#616173] line-clamp-2 leading-snug min-h-[38px]">
            {product.title}
          </h3>
        </div>

        <div className="mt-2">
          {/* Price Row */}
          <div className="flex items-baseline gap-1.5 tabular-nums flex-wrap">
            <span className="text-[20px] font-bold text-[#353543]">₹{product.price}</span>
            <span className="text-xs text-[#8B8BA3] line-through">₹{product.mrp}</span>
            <span className="text-xs font-bold text-[#038D63]">
              {product.discountPercent}% off
            </span>
          </div>

          {/* Delivery Metadata */}
          <div className="mt-1.5">
            <span className="inline-block bg-[#F8F8FA] text-[#616173] text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums">
              {product.freeDelivery
                ? 'Free Delivery'
                : `Delivery ₹${product.deliveryFee || 51}`}
            </span>
          </div>

          {/* Meesho Green Rating Row */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-[#038D63] text-white text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
              {product.rating.toFixed(1)}
              <Star className="w-3 h-3 fill-white text-white" />
            </span>
            <span className="text-xs text-[#8B8BA3] tabular-nums truncate">
              {product.ratingCount.toLocaleString('en-IN')} Reviews
            </span>
            {product.isTrusted && (
              <span className="ml-auto text-[11px] font-semibold text-[#9F2089] shrink-0">
                mTrusted
              </span>
            )}
          </div>
        </div>
      </button>
    </article>
  );
};
