import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, Zap, Tag, Gift, Check } from 'lucide-react';

interface OfferSectionProps {
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

export const OfferSection: React.FC<OfferSectionProps> = ({
  products,
  onAddToCart,
  onDirectBuy,
  onSelectProduct
}) => {
  const offerProducts = React.useMemo(() => {
    return products.filter(p => p.status !== 'Inactive' && p.stock > 0 && p.isOffer);
  }, [products]);

  // Keep track of selected size for each product card: productId -> selectedSize
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  if (offerProducts.length === 0) return null;

  return (
    <section className="space-y-6 pt-6 pb-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
            <Gift className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-1 backdrop-blur-xs">
              <Tag className="w-3.5 h-3.5" /> সীমিত সময়ের ধামাকা অফার
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              ⚡ স্পেশাল ডিসকাউন্ট ও অফার কর্নার
            </h2>
            <p className="text-white/90 text-xs md:text-sm font-medium mt-1">
              প্রতিটি পরিমাণের (যেমন: ৫০০ গ্রাম ও ১ কেজি) জন্য বিশেষ ছাড়ে সেরা পণ্যগুলো লুফে নিন!
            </p>
          </div>
        </div>
        <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <span className="block text-2xl md:text-3xl font-black">{toBengaliNumber(offerProducts.length)}</span>
          <span className="text-xs font-bold text-white/90">টি অফার চলমান</span>
        </div>
      </div>

      {/* Grid of Offer Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offerProducts.map((product) => {
          const hasSizes = product.sizes && product.sizes.length > 0;
          const defaultSize = hasSizes ? product.sizes![0] : undefined;
          const currentSize = selectedSizes[product.id] || defaultSize;

          // Determine price & original price based on selected size or product level
          let offerPrice = product.offerPrice !== undefined ? product.offerPrice : product.price;
          let origPrice = product.originalPrice && product.originalPrice > offerPrice ? product.originalPrice : product.price;

          if (currentSize && product.sizePrices && product.sizePrices[currentSize]) {
            const sp = product.sizePrices[currentSize];
            if (sp.offerPrice && sp.offerPrice > 0) {
              offerPrice = sp.offerPrice;
              origPrice = sp.originalPrice || sp.price;
            } else if (product.offerPrice && product.offerPrice > 0) {
              offerPrice = product.offerPrice;
              origPrice = sp.originalPrice || sp.price;
            } else {
              offerPrice = sp.price;
              origPrice = sp.originalPrice || sp.price;
            }
          }

          const savings = Math.max(0, origPrice - offerPrice);
          const discountPercent = origPrice > offerPrice ? Math.round((savings / origPrice) * 100) : 0;

          return (
            <div
              key={product.id}
              className="bg-white rounded-3xl border-2 border-amber-300 hover:border-amber-500 p-4 transition-all duration-300 hover:shadow-xl flex flex-col justify-between group relative overflow-hidden bg-gradient-to-b from-amber-50/30 to-white"
            >
              {/* Top Banner Tag */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-amber-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-2xl shadow-sm flex items-center gap-1 z-10">
                <Tag className="w-3 h-3" />
                <span>বিশেষ ছাড় {discountPercent > 0 ? `(${toBengaliNumber(discountPercent)}%)` : ''}</span>
              </div>

              <div>
                {/* Image & Discount Badge */}
                <div 
                  onClick={() => onSelectProduct(product)}
                  className="w-full h-48 sm:h-52 rounded-2xl overflow-hidden relative bg-gray-100 border border-amber-100 cursor-pointer shadow-inner mb-4"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {discountPercent > 0 && (
                    <span className="absolute top-3 left-3 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                      ⚡ ছাড়ে বাঁচুন ৳{toBengaliNumber(savings)}
                    </span>
                  )}
                </div>

                {/* Category & Title */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {product.category}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      স্টকে আছে ({toBengaliNumber(product.stock)} {product.unit})
                    </span>
                  </div>

                  <h3 
                    onClick={() => onSelectProduct(product)}
                    className="font-black text-gray-900 text-base line-clamp-2 leading-snug cursor-pointer hover:text-amber-700 transition-colors pt-1"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                </div>

                {/* Sizes Selector (Crucial for 500g vs 1kg distinction) */}
                {hasSizes && product.sizes && (
                  <div className="mb-4 bg-amber-50/80 p-2.5 rounded-2xl border border-amber-200">
                    <div className="text-[11px] font-black text-amber-900 mb-1.5 flex items-center justify-between">
                      <span>পরিমাণ / সাইজ নির্বাচন করুন:</span>
                      <span className="text-[10px] text-amber-700 bg-white px-2 py-0.5 rounded font-bold border border-amber-200">
                        {currentSize} নির্বাচিত
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map((sz) => {
                        const isSelected = sz === currentSize;
                        const szPriceInfo = product.sizePrices?.[sz];
                        const szPrice = (szPriceInfo?.offerPrice && szPriceInfo.offerPrice > 0)
                          ? szPriceInfo.offerPrice
                          : (product.offerPrice && product.offerPrice > 0 ? product.offerPrice : (szPriceInfo?.price ?? offerPrice));
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSizes({ ...selectedSizes, [product.id]: sz })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-700 shadow-sm scale-105'
                                : 'bg-white text-gray-800 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            <span>{sz}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-amber-100' : 'text-emerald-700 font-black'}`}>
                              ৳{toBengaliNumber(szPrice)}
                            </span>
                            {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Action Footer */}
              <div className="pt-3 border-t border-amber-100 mt-auto space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block font-bold">অফার মূল্য:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-emerald-700 text-xl font-sans">
                        ৳{toBengaliNumber(offerPrice)}
                      </span>
                      {origPrice > offerPrice && (
                        <span className="text-xs text-gray-400 line-through font-sans font-bold">
                          ৳{toBengaliNumber(origPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  {savings > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 inline-block">
                        সাশ্রয় ৳{toBengaliNumber(savings)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onAddToCart(product, 1, currentSize)}
                    className="bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-900 border border-amber-300 font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>কার্টে নিন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDirectBuy(product, currentSize)}
                    className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>অর্ডার করুন</span>
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

export default OfferSection;
