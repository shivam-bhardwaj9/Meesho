import React, { useState, useEffect } from 'react';
import {
  Star,
  ShoppingCart,
  ChevronsRight,
  Heart,
  Truck,
  Banknote,
  RotateCcw,
  Store,
  Check,
  MapPin,
  ThumbsUp,
  ArrowLeft,
  Share2,
  Copy,
} from 'lucide-react';
import { CategoryId, Product } from '../types/meesho';
import { ProductCard } from './ProductCard';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  wishlistIds: string[];
  onBackHome: () => void;
  onSelectCategory: (cat: CategoryId) => void;
  onOpenProduct: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, size?: string) => void;
  onBuyNow: (product: Product, size: string) => void;
  onAddReview: (
    productId: string,
    author: string,
    rating: number,
    comment: string
  ) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  wishlistIds,
  onBackHome,
  onSelectCategory,
  onOpenProduct,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onAddReview,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [pincode, setPincode] = useState('560038');
  const [pincodeResult, setPincodeResult] = useState<string | null>(
    'Estimated delivery in 3–4 days · Cash on Delivery available'
  );
  const [followedShop, setFollowedShop] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    setSelectedSize(product.sizes[0] || 'Free Size');
    setAddedFeedback(false);
    setFollowedShop(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  const isWishlisted = wishlistIds.includes(product.id);
  const activeSize =
    selectedSize && product.sizes.includes(selectedSize)
      ? selectedSize
      : product.sizes[0] || 'Free Size';

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(
      allProducts.filter(
        (p) => p.id !== product.id && p.category !== product.category
      )
    )
    .slice(0, 8);

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pincode.trim();
    if (!/^\d{6}$/.test(cleaned)) {
      setPincodeResult('Please enter a valid 6-digit Indian pincode.');
      return;
    }
    setPincodeResult(
      `Delivery to ${cleaned} in 3–5 days · ${
        product.freeDelivery ? 'Free Delivery' : '₹49 Delivery'
      }${product.codAvailable ? ' · COD Available' : ''}`
    );
  };

  const handleAdd = () => {
    onAddToCart(product, activeSize);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(product.code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    onAddReview(
      product.id,
      reviewAuthor.trim() || 'Verified Shopper',
      reviewRating,
      reviewComment.trim()
    );
    setReviewAuthor('');
    setReviewComment('');
    setReviewRating(5);
  };

  return (
    <div className="bg-white pb-20 sm:pb-12">
      {/* Breadcrumb & Back Navigation */}
      <div className="border-b border-[#EAEAEF] bg-[#F8F8FA]">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#616173] min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 font-semibold text-[#9F2089] hover:underline shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Products</span>
            </button>
            <span aria-hidden="true">/</span>
            <button
              type="button"
              onClick={() => onSelectCategory(product.category)}
              className="hover:text-[#9F2089] shrink-0 cursor-pointer"
            >
              {product.category}
            </button>
            <span aria-hidden="true">/</span>
            <span className="text-[#353543] font-medium truncate">
              {product.title}
            </span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#353543] hover:text-[#9F2089] px-3 py-1.5 bg-white border border-[#EAEAEF] rounded-md cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Meesho 2-Column PDP Layout */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Column: Product Image + Primary CTAs */}
          <div className="lg:col-span-5 lg:sticky lg:top-[132px] space-y-4">
            <div className="relative aspect-[3/4] bg-[#F8F8FA] border border-[#EAEAEF] rounded-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label={
                  isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
                }
                className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-white/95 border border-[#EAEAEF] flex items-center justify-center text-[#616173] hover:text-[#F43397] shadow-sm cursor-pointer"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? 'fill-[#F43397] text-[#F43397]' : ''
                  }`}
                />
              </button>
            </div>

            {/* Desktop Add to Cart & Buy Now Buttons */}
            <div className="hidden sm:grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-md border-2 border-[#9F2089] text-[#9F2089] hover:bg-[#9F2089]/5 font-bold text-base transition-colors cursor-pointer"
              >
                {addedFeedback ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onBuyNow(product, activeSize)}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-md bg-[#9F2089] hover:bg-[#831871] text-white font-bold text-base transition-colors cursor-pointer"
              >
                <ChevronsRight className="w-5 h-5" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Right Column: Price, Sizes, Delivery, Specs, Seller, Reviews */}
          <div className="lg:col-span-7 space-y-5">
            {/* Title & Price Module */}
            <div className="border border-[#EAEAEF] rounded-lg p-5 sm:p-6 bg-white">
              <p className="text-xs font-semibold text-[#616173] mb-1.5">
                {product.category} · {product.subCategory}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-[#353543] leading-snug">
                {product.title}
              </h1>

              <div className="mt-4 flex items-baseline gap-3 tabular-nums">
                <span className="text-3xl font-extrabold text-[#353543]">
                  ₹{product.price}
                </span>
                <span className="text-base text-[#8B8BA3] line-through">
                  ₹{product.mrp}
                </span>
                <span className="text-base font-bold text-[#038D63]">
                  {product.discountPercent}% off
                </span>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 bg-[#038D63] text-white text-xs font-bold px-2.5 py-1 rounded-full tabular-nums">
                  {product.rating.toFixed(1)}
                  <Star className="w-3 h-3 fill-white text-white" />
                </span>
                <span className="text-xs sm:text-sm text-[#616173] tabular-nums">
                  {product.ratingCount.toLocaleString('en-IN')} Ratings ·{' '}
                  {product.reviewCount.toLocaleString('en-IN')} Reviews
                </span>
                {product.isTrusted && (
                  <span className="text-xs font-bold text-[#9F2089]">
                    mTrusted Quality
                  </span>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-[#EAEAEF] flex flex-wrap gap-5 text-xs sm:text-sm font-medium text-[#353543]">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#9F2089]" />
                  {product.freeDelivery ? 'Free Delivery' : '₹49 Delivery'}
                </span>
                {product.codAvailable && (
                  <span className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#9F2089]" />
                    Cash on Delivery
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#9F2089]" />
                  7 Days Easy Returns
                </span>
              </div>
            </div>

            {/* Select Size */}
            <div className="border border-[#EAEAEF] rounded-lg p-5 sm:p-6 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-[#353543]">Select Size</h2>
                <span className="text-xs font-semibold text-[#038D63] tabular-nums">
                  {product.stock > 0
                    ? `In Stock (${product.stock} left)`
                    : 'Out of Stock'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((size) => {
                  const isSelected = activeSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#9F2089] bg-[#9F2089]/10 text-[#9F2089]'
                          : 'border-[#EAEAEF] bg-white text-[#353543] hover:border-[#9F2089]/50'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Check Delivery Date */}
            <div className="border border-[#EAEAEF] rounded-lg p-5 sm:p-6 bg-white">
              <h2 className="text-base font-bold text-[#353543] mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#9F2089]" />
                <span>Check Delivery Date</span>
              </h2>
              <form onSubmit={handleCheckPincode} className="flex gap-2.5 max-w-md">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 border border-[#EAEAEF] focus:border-[#9F2089] rounded-md px-3.5 py-2 text-sm tabular-nums focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-[#9F2089] hover:bg-[#9F2089]/5 border border-[#9F2089]/40 rounded-md cursor-pointer"
                >
                  Check
                </button>
              </form>
              {pincodeResult && (
                <p className="text-xs sm:text-sm font-medium text-[#038D63] mt-2.5">
                  {pincodeResult}
                </p>
              )}
            </div>

            {/* Product Details */}
            <div className="border border-[#EAEAEF] rounded-lg p-5 sm:p-6 bg-white">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-base font-bold text-[#353543]">Product Details</h2>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#616173] hover:text-[#9F2089] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Copied!' : `Code: ${product.code}`}</span>
                </button>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div>
                  <dt className="text-xs text-[#616173]">Fabric / Material</dt>
                  <dd className="font-medium text-[#353543] mt-0.5">
                    {product.fabricOrMaterial}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#616173]">Pattern</dt>
                  <dd className="font-medium text-[#353543] mt-0.5">
                    {product.pattern}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#616173]">Net Quantity</dt>
                  <dd className="font-medium text-[#353543] mt-0.5">
                    {product.netQuantity}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#616173]">Country of Origin</dt>
                  <dd className="font-medium text-[#353543] mt-0.5">
                    {product.countryOfOrigin}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 pt-4 border-t border-[#EAEAEF] text-sm text-[#616173] leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Sold By Supplier */}
            <div className="border border-[#EAEAEF] rounded-lg p-5 sm:p-6 bg-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#9F2089]/10 text-[#9F2089] flex items-center justify-center shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#353543]">
                    {product.supplier.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#616173] tabular-nums">
                    {product.supplier.city} · {product.supplier.rating} ★ ·{' '}
                    {product.supplier.followers} Followers ·{' '}
                    {product.supplier.productsCount} Products
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFollowedShop((f) => !f)}
                className={`px-5 py-2.5 rounded-md text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                  followedShop
                    ? 'bg-[#9F2089] text-white border-[#9F2089]'
                    : 'border-[#9F2089] text-[#9F2089] hover:bg-[#9F2089]/5'
                }`}
              >
                {followedShop ? 'Following Shop' : 'Follow Shop'}
              </button>
            </div>

            {/* Product Ratings & Reviews */}
            <div className="border border-[#EAEAEF] rounded-lg p-5 sm:p-6 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#353543]">
                  Product Ratings &amp; Reviews
                </h2>
                <span className="text-sm font-bold text-[#038D63] tabular-nums">
                  {product.rating.toFixed(1)} ★ ({product.ratingCount.toLocaleString('en-IN')})
                </span>
              </div>

              {product.reviews.length === 0 ? (
                <p className="text-sm text-[#616173]">
                  Be the first to review this item after your purchase.
                </p>
              ) : (
                <div className="divide-y divide-[#EAEAEF] space-y-4">
                  {product.reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 bg-[#038D63] text-white text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
                            {rev.rating}.0 ★
                          </span>
                          <span className="text-sm font-semibold text-[#353543]">
                            {rev.author}
                          </span>
                        </div>
                        <span className="text-xs text-[#8B8BA3]">{rev.date}</span>
                      </div>
                      <p className="mt-2 text-sm text-[#353543] leading-relaxed">
                        {rev.comment}
                      </p>
                      <p className="mt-1.5 text-xs text-[#616173] flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Helpful ({rev.helpfulCount})</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleReviewSubmit}
                className="pt-4 border-t border-[#EAEAEF] space-y-3"
              >
                <p className="text-xs font-semibold text-[#353543]">Write a Review</p>
                <div className="flex flex-wrap gap-2.5">
                  <input
                    type="text"
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 min-w-[160px] border border-[#EAEAEF] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="border border-[#EAEAEF] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#9F2089]"
                  >
                    <option value={5}>5 ★ Excellent</option>
                    <option value={4}>4 ★ Good</option>
                    <option value={3}>3 ★ Average</option>
                    <option value={2}>2 ★ Below Average</option>
                    <option value={1}>1 ★ Poor</option>
                  </select>
                </div>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your feedback about quality, fit, and delivery..."
                    className="flex-1 border border-[#EAEAEF] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#9F2089] hover:bg-[#831871] text-white text-xs font-bold rounded-md cursor-pointer whitespace-nowrap"
                  >
                    Post Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Related Products Grid */}
        <section className="mt-12 pt-8 border-t border-[#EAEAEF]">
          <h2 className="text-xl font-bold text-[#353543] mb-5">
            People also viewed
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                isWishlisted={wishlistIds.includes(rel.id)}
                onToggleWishlist={onToggleWishlist}
                onOpenProduct={onOpenProduct}
                onQuickAdd={(p) => onAddToCart(p)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Mobile Sticky Bottom Buy Bar */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-[#EAEAEF] px-3 py-2.5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-md border-2 border-[#9F2089] text-[#9F2089] font-bold text-sm"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{addedFeedback ? 'Added' : 'Add to Cart'}</span>
        </button>
        <button
          type="button"
          onClick={() => onBuyNow(product, activeSize)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-[#9F2089] text-white font-bold text-sm"
        >
          <ChevronsRight className="w-4 h-4" />
          <span>Buy Now</span>
        </button>
      </div>
    </div>
  );
};
