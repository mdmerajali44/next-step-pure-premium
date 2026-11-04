import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { ShoppingCart, Zap, Flame, ChevronLeft, ChevronRight, Tag, Gift, Sparkles, Check } from 'lucide-react';

interface FeaturedDealsSectionProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  onDirectBuy: (product: Product, selectedSize?: string) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllOffers?: () => void;
}

const toBengaliNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '০';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => bnDigits[parseInt(digit, 10)]);
};

export const FeaturedDealsSection: React.FC<FeaturedDealsSectionProps> = ({
  products,
  onAddToCart,
  onDirectBuy,
  onSelectProduct,
  onViewAllOffers
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [isPaused, setIsPaused] = useState(false);

  // Strictly filter products marked as Special Offer (isOffer === true)
  const dealProducts = React.useMemo(() => {
    return products.filter(
      p => p.status !== 'Inactive' && p.stock > 0 && p.isOffer
    );
  }, [products]);

  // Smooth scroll handler
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const step = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -step : step,
        behavior: 'smooth'
      });
    }
  };

  // Continuous auto-advance: slides one after another smoothly in single line
  useEffect(() => {
    if (dealProducts.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // If reached end, seamlessly loop back to start
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Slide by exactly one card width
          scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }
    }, 3200);

    return () => clearInterval(interval);
  }, [dealProducts.length, isPaused]);

  if (dealProducts.length === 0) return null;

  return (
    <section 
      className="bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-red-500/10 border-2 border-orange-300 rounded-3xl p-4 md:p-6 shadow-md space-y-4 my-6 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-400/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title, live counters and navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-200/80 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Flame className="w-6 h-6 fill-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-gray-950 text-base md:text-xl tracking-tight">
                স্পেশাল অফার ও হট ডিলস
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs animate-pulse">
                সীমিত সময়
              </span>
            </div>
            <p className="text-xs text-gray-600 font-bold mt-0.5">
              অ্যাডমিন নির্বাচিত বিশেষ ছাড়ের পণ্যসমূহ • একটার পর একটা চলমান ধামাকা অফার
            </p>
          </div>
        </div>

        {/* Action badges & scroll buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-black text-orange-800 bg-orange-100/90 border border-orange-200 px-3 py-1 rounded-full whitespace-nowrap">
            {toBengaliNumber(dealProducts.length)}টি অফার চালু
          </span>

          {onViewAllOffers && (
            <button
              type="button"
              onClick={onViewAllOffers}
              className="text-xs font-extrabold text-orange-700 hover:text-orange-900 bg-white hover:bg-orange-50 border border-orange-200 px-3 py-1 rounded-full shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              সবগুলো দেখুন ➔
            </button>
          )}

          <div className="flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-white border border-orange-300 hover:bg-orange-600 hover:text-white text-orange-700 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="পূর্ববর্তী"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-white border border-orange-300 hover:bg-orange-600 hover:text-white text-orange-700 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="পরবর্তী"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Single Line Container (Strictly one line, smooth scrolling, pauses on hover) */}
      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 px-1 snap-x scroll-smooth relative z-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dealProducts.map((product) => {
          // Identify size options
          const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : [];
          const currentSize = selectedSizes[product.id] || (availableSizes.length > 0 ? availableSizes[0] : product.unit);
          
          // Size-specific offer price & original price calculation
          let displayPrice = product.offerPrice && product.offerPrice > 0 ? product.offerPrice : product.price;
          let originalPrice = product.originalPrice && product.originalPrice > displayPrice ? product.originalPrice : undefined;

          if (availableSizes.length > 0 && product.sizePrices && product.sizePrices[currentSize]) {
            const sp = product.sizePrices[currentSize];
            if (sp.offerPrice && sp.offerPrice > 0) {
              displayPrice = sp.offerPrice;
              originalPrice = sp.originalPrice || sp.price;
            } else if (product.offerPrice && product.offerPrice > 0) {
              displayPrice = product.offerPrice;
              originalPrice = sp.originalPrice || sp.price;
            } else {
              displayPrice = sp.price;
              originalPrice = sp.originalPrice;
            }
          }

          const savings = originalPrice && originalPrice > displayPrice ? originalPrice - displayPrice : 0;
          const discountPercent = originalPrice && originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

          return (
            <div
              key={product.id}
              className="w-[280px] sm:w-[310px] shrink-0 bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-500 p-3.5 transition-all duration-300 hover:shadow-xl flex flex-col justify-between group relative overflow-hidden snap-start select-none"
            >
              {/* Ribbon Badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-red-600 via-rose-600 to-orange-600 text-white text-[10px] font-black px-3.5 py-1 rounded-bl-2xl shadow-xs flex items-center gap-1 z-10">
                <Tag className="w-3 h-3" />
                <span>স্পেশাল অফার</span>
              </div>

              <div>
                {/* Image & Discount Badge */}
                <div 
                  onClick={() => onSelectProduct(product)}
                  className="w-full h-40 rounded-xl overflow-hidden relative bg-gray-50 border border-orange-100 cursor-pointer mb-3"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {discountPercent > 0 && (
                    <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                      <span>-{toBengaliNumber(discountPercent)}% ছাড়</span>
                    </span>
                  )}
                </div>

                {/* Category & Title */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-orange-700 bg-orange-100/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {product.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      স্টকে আছে ({toBengaliNumber(product.stock)})
                    </span>
                  </div>

                  <h4 
                    onClick={() => onSelectProduct(product)}
                    className="font-black text-gray-900 text-sm line-clamp-2 leading-snug cursor-pointer hover:text-orange-600 transition-colors h-10 pt-0.5"
                    title={product.name}
                  >
                    {product.name}
                  </h4>
                </div>

                {/* Quantity / Size Options (Crucial for 500g vs 1kg distinct pricing) */}
                {availableSizes.length > 0 && (
                  <div className="mb-3 p-2 bg-orange-50/80 rounded-xl border border-orange-200/90 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-orange-950">
                      <span>পরিমাণ / সাইজ সিলেক্ট করুন:</span>
                      <span className="text-orange-700 font-extrabold bg-white px-1.5 py-0.5 rounded border border-orange-200">
                        {currentSize}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSizes.map(sz => {
                        const isSelected = sz === currentSize;
                        const szInfo = product.sizePrices?.[sz];
                        const szPrice = (szInfo?.offerPrice && szInfo.offerPrice > 0)
                          ? szInfo.offerPrice
                          : (product.offerPrice && product.offerPrice > 0 ? product.offerPrice : (szInfo?.price ?? product.price));

                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSizes(prev => ({ ...prev, [product.id]: sz }));
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1 border ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-700 shadow-sm scale-102'
                                : 'bg-white text-gray-800 border-orange-200 hover:bg-orange-100/70'
                            }`}
                          >
                            <span>{sz}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-emerald-700 font-black'}`}>
                              ৳{toBengaliNumber(szPrice)}
                            </span>
                            {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pricing Area */}
                <div className="flex items-baseline gap-2 mb-3 pt-1 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block">অফার রেট:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-emerald-700 text-xl font-sans">
                        ৳{toBengaliNumber(displayPrice)}
                      </span>
                      {originalPrice && originalPrice > displayPrice && (
                        <span className="text-xs text-gray-400 line-through font-sans font-bold">
                          ৳{toBengaliNumber(originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {savings > 0 && (
                    <div className="ml-auto text-right">
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 inline-block shadow-3xs">
                        সাশ্রয় ৳{toBengaliNumber(savings)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 mt-auto">
                <button
                  type="button"
                  onClick={() => onAddToCart(product, 1, currentSize)}
                  className="bg-orange-100 hover:bg-orange-200 active:bg-orange-300 text-orange-900 border border-orange-300 font-extrabold text-xs py-2.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>কার্টে নিন</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDirectBuy(product, currentSize)}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 active:scale-98 text-white font-black text-xs py-2.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>অর্ডার করুন</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedDealsSection;
