import React, { useState, useMemo } from 'react';
import { Product, User } from '../types';
import { Flame, ShoppingCart, Zap, Star } from 'lucide-react';
import { getValidImageSrc, handleImageError } from '../utils/imageUtils';

export interface BestSellerSectionProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  onDirectBuy: (product: Product, selectedSize?: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onRequestProduct?: (product: Product) => void;
  onViewImage?: (image: string) => void;
  onViewAll?: () => void;
  users?: User[];
}

const toBengaliNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '০';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => bnDigits[parseInt(digit, 10)]);
};

export interface BestSellerCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  onDirectBuy: (product: Product, selectedSize?: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const BestSellerCard: React.FC<BestSellerCardProps> = ({
  product,
  onAddToCart,
  onDirectBuy,
  onSelectProduct,
}) => {
  // Size selection state
  const initialSize = useMemo(() => {
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes[0];
    }
    return undefined;
  }, [product.sizes]);

  const [selectedSize, setSelectedSize] = useState<string | undefined>(initialSize);

  // Compute pricing based on selected size or base product
  const effectivePrice = useMemo(() => {
    let currentPrice = product.price;

    if (selectedSize && product.sizePrices && product.sizePrices[selectedSize]) {
      const sp = product.sizePrices[selectedSize];
      currentPrice = sp.offerPrice || sp.price;
    } else if (product.isOffer && product.offerPrice) {
      currentPrice = product.offerPrice;
    }

    return currentPrice;
  }, [product, selectedSize]);

  // Display unit label
  const unitLabel = selectedSize || product.unit || '';

  return (
    <div className="relative bg-white rounded-2xl border border-amber-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden group">
      {/* Top Right Corner Ribbon: "★ বেস্ট সেলার" */}
      <div className="absolute top-0 right-0 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-bl-lg shadow-2xs">
          <Star className="w-2.5 h-2.5 fill-white text-white" />
          <span>বেস্ট সেলার</span>
        </span>
      </div>

      <div>
        {/* Product Image */}
        <div
          onClick={() => onSelectProduct(product)}
          className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white mb-2 flex items-center justify-center relative p-1 cursor-pointer select-none"
        >
          <img
            src={getValidImageSrc(product.image)}
            alt={product.name}
            className="max-h-full max-w-full object-contain p-1 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
        </div>

        {/* Category Label */}
        <div className="mb-1">
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50/80 border border-amber-100/80 px-2 py-0.5 rounded-md inline-block">
            {product.category}
          </span>
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onSelectProduct(product)}
          className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 leading-tight mb-2 min-h-[2.1rem] cursor-pointer hover:text-orange-600 transition-colors"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Size Selector Pills */}
        <div className="min-h-[1.6rem] mb-2">
          {product.sizes && product.sizes.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(s);
                  }}
                  className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                    selectedSize === s
                      ? 'bg-[#ea580c] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="h-4" />
          )}
        </div>
      </div>

      <div>
        {/* Pricing Row */}
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-[#e11d48] font-black text-sm sm:text-base">
            ৳{toBengaliNumber(effectivePrice)}
          </span>
          {unitLabel && (
            <span className="text-[10px] text-gray-500 font-bold">
              / {unitLabel}
            </span>
          )}
        </div>

        {/* Action Buttons Row: "🛒 কার্ট" and "⚡ অর্ডার" */}
        <div className="flex items-center gap-1.5 pt-1">
          {/* Cart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, 1, selectedSize);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1 border border-amber-300 text-amber-900 bg-[#fffbeb] hover:bg-amber-100 active:scale-95 rounded-lg py-1.5 px-2 text-xs font-black transition-all cursor-pointer shadow-3xs"
          >
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2] text-amber-700" />
            <span>কার্ট</span>
          </button>

          {/* Order Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDirectBuy(product, selectedSize);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1 bg-[#006437] hover:bg-emerald-800 active:scale-95 text-white rounded-lg py-1.5 px-2 text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white text-white" />
            <span>অর্ডার</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const BestSellerSection: React.FC<BestSellerSectionProps> = ({
  products,
  onAddToCart,
  onDirectBuy,
  onSelectProduct,
}) => {
  // Sort products to match screenshot image_bfecab46.png:
  // 1. p8: Nutritious Honey Nuts
  // 2. p5: Mustard Oil
  // 3. m1: Amropali Mango
  // 4. h4: Sundarban Honey
  // 5. m3: Gobindobhog Mango
  const bestSellerProducts = useMemo(() => {
    const priorityIds = ['p8', 'p5', 'm1', 'h4', 'm3'];
    const activeProducts = products.filter(p => p.status !== 'Inactive' && p.stock > 0);

    const ordered: Product[] = [];
    priorityIds.forEach(id => {
      const match = activeProducts.find(p => p.id === id);
      if (match) ordered.push(match);
    });

    // Append any remaining products marked isBestSeller
    activeProducts.forEach(p => {
      if (p.isBestSeller && !ordered.some(o => o.id === p.id)) {
        ordered.push(p);
      }
    });

    return ordered.length > 0 ? ordered.slice(0, 5) : activeProducts.slice(0, 5);
  }, [products]);

  if (bestSellerProducts.length === 0) return null;

  return (
    <section className="bg-[#fff8ea] border-2 border-[#fcd34d] rounded-3xl p-4 sm:p-5 md:p-6 shadow-xs my-6 space-y-4 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-300/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header matching screenshot image_bfecab46.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-amber-200/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f97316] text-white flex items-center justify-center shadow-xs shrink-0">
            <Flame className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                সেরা বিক্রীত পণ্য (Best Sellers)
              </h2>
              <span className="text-[10px] font-bold bg-[#ea580c] text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                শীর্ষ জনপ্রিয়
              </span>
            </div>
            <p className="text-xs text-amber-950/80 font-bold mt-0.5">
              আমাদের সবচেয়ে জনপ্রিয় ও ক্রেতাদের সর্বোচ্চ বিশ্বস্ত খাঁটি পণ্যসমূহ
            </p>
          </div>
        </div>

        {/* Right Badge: ★ ৫টি বেস্ট সেলার আইটেম */}
        <div className="bg-white/95 px-3.5 py-1.5 rounded-full border border-amber-300 text-center shrink-0 self-start sm:self-center shadow-2xs flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span className="text-xs font-black text-amber-950">
            {toBengaliNumber(bestSellerProducts.length)}টি বেস্ট সেলার আইটেম
          </span>
        </div>
      </div>

      {/* 5-Column Responsive Grid matching screenshot image_bfecab46.png */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5 relative z-10 items-stretch">
        {bestSellerProducts.map((product) => (
          <BestSellerCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onDirectBuy={onDirectBuy}
            onSelectProduct={onSelectProduct}
          />
        ))}
      </div>
    </section>
  );
};

export default BestSellerSection;
