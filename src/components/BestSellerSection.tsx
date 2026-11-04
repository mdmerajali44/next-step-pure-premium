import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, Zap, Flame, Star, Sparkles, Check } from 'lucide-react';

interface BestSellerSectionProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  onDirectBuy: (product: Product, selectedSize?: string) => void;
  onSelectProduct: (product: Product) => void;
}

const toBengaliNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '০';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => bnDigits[parseInt(digit, 10)]);
};

export const BestSellerSection: React.FC<BestSellerSectionProps> = ({
  products,
  onAddToCart,
  onDirectBuy,
  onSelectProduct
}) => {
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  const bestSellerProducts = React.useMemo(() => {
    const marked = products.filter(p => p.status !== 'Inactive' && p.stock > 0 && p.isBestSeller);
    if (marked.length > 0) return marked;
    return products.filter(p => p.status !== 'Inactive' && p.stock > 0).slice(0, 5);
  }, [products]);

  if (bestSellerProducts.length === 0) return null;

  return (
    <section className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-600/15 border-2 border-amber-300/80 rounded-3xl p-4 sm:p-5 md:p-6 shadow-md space-y-4 my-6 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header - High visibility, stylish and compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Flame className="w-6 h-6 fill-amber-200 text-amber-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-gray-950 text-base md:text-xl tracking-tight">
                সেরা বিক্রীত পণ্য (Best Sellers)
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 to-orange-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                শীর্ষ জনপ্রিয়
              </span>
            </div>
            <p className="text-xs text-amber-900/90 font-bold mt-0.5">
              আমাদের সবচেয়ে জনপ্রিয় ও ক্রেতাদের সর্বোচ্চ বিশ্বস্ত খাঁটি পণ্যসমূহ
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-amber-300 text-center shrink-0 self-start sm:self-center shadow-2xs flex items-center gap-2">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span className="text-xs font-black text-amber-950">
            {toBengaliNumber(bestSellerProducts.length)}টি বেস্ট সেলার আইটেম
          </span>
        </div>
      </div>

      {/* Product Grid - Compact 4-5 card layout matching standard store size */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-3.5 relative z-10">
        {bestSellerProducts.map((product) => {
          const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : [];
          const currentSize = selectedSizes[product.id] || (availableSizes.length > 0 ? availableSizes[0] : product.unit);
          
          let displayPrice = product.isOffer && product.offerPrice ? product.offerPrice : product.price;
          let origPrice = product.originalPrice && product.originalPrice > displayPrice ? product.originalPrice : undefined;

          if (availableSizes.length > 0 && product.sizePrices && product.sizePrices[currentSize]) {
            const sp = product.sizePrices[currentSize];
            if (product.isOffer && sp.offerPrice && sp.offerPrice > 0) {
              displayPrice = sp.offerPrice;
              origPrice = sp.originalPrice || sp.price;
            } else {
              displayPrice = sp.price;
              if (sp.originalPrice && sp.originalPrice > displayPrice) {
                origPrice = sp.originalPrice;
              }
            }
          }

          const savings = origPrice ? Math.max(0, origPrice - displayPrice) : 0;
          const discountPercent = origPrice ? Math.round((savings / origPrice) * 100) : 0;

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-amber-200 hover:border-amber-400 p-2.5 sm:p-3 transition-all duration-300 hover:shadow-lg flex flex-col justify-between group relative overflow-hidden text-gray-900"
            >
              {/* Best Seller Ribbon */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-600 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-xl shadow-2xs flex items-center gap-0.5 z-10">
                <Star className="w-2.5 h-2.5 fill-amber-200 text-amber-200" />
                <span>বেস্ট সেলার</span>
              </div>

              <div>
                {/* Image */}
                <div 
                  onClick={() => onSelectProduct(product)}
                  className="w-full h-32 sm:h-36 md:h-40 rounded-xl overflow-hidden relative bg-gray-50 border border-gray-100 cursor-pointer mb-2"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {discountPercent > 0 && (
                    <span className="absolute top-2 left-2 bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-lg shadow-xs">
                      -{toBengaliNumber(discountPercent)}%
                    </span>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-1 mb-1.5">
                  <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider block truncate">
                    {product.category}
                  </span>
                  <h4 
                    onClick={() => onSelectProduct(product)}
                    className="font-black text-gray-900 text-xs sm:text-[13px] line-clamp-2 leading-snug cursor-pointer hover:text-amber-600 transition-colors h-8 pt-0.5"
                    title={product.name}
                  >
                    {product.name}
                  </h4>
                </div>

                {/* Available Size Pills */}
                {availableSizes.length > 1 && (
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-1">
                      {availableSizes.map((sz) => {
                        const isSelected = sz === currentSize;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: sz }))}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-gray-100 text-gray-700 hover:bg-amber-50 border border-gray-200'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Price and Action Buttons */}
              <div className="pt-2 border-t border-gray-100 mt-auto">
                <div className="flex items-baseline justify-between gap-1 mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm sm:text-base font-black text-orange-600">
                      ৳{toBengaliNumber(displayPrice)}
                    </span>
                    {origPrice && (
                      <span className="text-[10px] sm:text-xs text-gray-400 line-through font-semibold">
                        ৳{toBengaliNumber(origPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold truncate">
                    / {currentSize}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddToCart(product, 1, currentSize)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-[10px] sm:text-xs py-1.5 px-1 rounded-lg border border-amber-200 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                    title="কার্টে যোগ করুন"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>কার্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDirectBuy(product, currentSize)}
                    className="bg-[#006437] hover:bg-[#004d2a] text-white font-black text-[10px] sm:text-xs py-1.5 px-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                    title="সরাসরি অর্ডার করুন"
                  >
                    <Zap className="w-3 h-3 fill-white" />
                    <span>অর্ডার</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BestSellerSection;
