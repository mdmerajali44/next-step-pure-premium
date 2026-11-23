import React, { useMemo } from 'react';
import { Product, User } from '../types';
import { Flame, Sparkles, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

interface FeaturedDealsSectionProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  onDirectBuy: (product: Product, selectedSize?: string) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllOffers?: () => void;
  onQuickView?: (product: Product) => void;
  onRequestProduct?: (product: Product) => void;
  onViewImage?: (image: string) => void;
  users?: User[];
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
  onViewAllOffers,
  onQuickView,
  onRequestProduct,
  onViewImage,
  users = [],
}) => {
  // Strictly filter active products marked as Special Offer
  const dealProducts = useMemo(() => {
    return products.filter(
      p => p.status !== 'Inactive' && p.stock > 0 && p.isOffer
    );
  }, [products]);

  if (dealProducts.length === 0) return null;

  return (
    <section className="bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-red-500/10 border-2 border-orange-300/80 rounded-3xl p-4 sm:p-5 md:p-6 shadow-md space-y-4 my-6 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
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
            <p className="text-xs text-orange-950/80 font-bold mt-0.5">
              অ্যাডমিন নির্বাচিত বিশেষ ছাড়ের পণ্যসমূহ • সেরা মূল্যে সেরা কোয়ালিটি
            </p>
          </div>
        </div>

        {/* Action badges & link */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-black text-orange-900 bg-white/90 border border-orange-300 px-3 py-1 rounded-full whitespace-nowrap shadow-3xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>{toBengaliNumber(dealProducts.length)}টি অফার চালু</span>
          </span>

          {onViewAllOffers && (
            <button
              type="button"
              onClick={onViewAllOffers}
              className="text-xs font-black text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 px-3.5 py-1.5 rounded-full shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 active:scale-95"
            >
              <span>সবগুলো দেখুন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Grid: Compact cards matching the store design, staying visible permanently */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5 relative z-10 items-stretch">
        {dealProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={(p) => onAddToCart(p)}
            onSelect={onSelectProduct}
            onDirectBuy={onDirectBuy}
            onQuickView={onQuickView ? onQuickView : onSelectProduct}
            onRequestProduct={onRequestProduct}
            onViewImage={onViewImage}
            isCompact={true}
            sellerName={
              product.sellerId
                ? users.find((u) => u.id === product.sellerId)?.shopName ||
                  users.find((u) => u.id === product.sellerId)?.name
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedDealsSection;
