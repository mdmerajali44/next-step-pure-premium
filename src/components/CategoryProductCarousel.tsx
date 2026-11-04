import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, User } from '../types';
import ProductCard from './ProductCard';

interface CategoryProductCarouselProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSelect: (product: Product) => void;
  onDirectBuy: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onRequestProduct?: (product: Product) => void;
  onViewImage?: (image: string) => void;
  users?: User[];
  isCompact?: boolean;
  cardsPerViewDesktop?: number; // 4 for banner layout, 5 for plain layout
  intervalSeconds?: number; // default 5s
}

export const CategoryProductCarousel: React.FC<CategoryProductCarouselProps> = ({
  products,
  onAddToCart,
  onSelect,
  onDirectBuy,
  onQuickView,
  onRequestProduct,
  onViewImage,
  users = [],
  isCompact = false,
  cardsPerViewDesktop = 5,
  intervalSeconds = 5,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(cardsPerViewDesktop);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Responsive cards per view
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setCardsPerView(2);
      } else if (width < 768) {
        setCardsPerView(2);
      } else if (width < 1024) {
        setCardsPerView(Math.min(3, cardsPerViewDesktop));
      } else {
        setCardsPerView(cardsPerViewDesktop);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cardsPerViewDesktop]);

  const totalProducts = products.length;

  // Reset index when products or view changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsTransitionEnabled(true);
  }, [totalProducts, cardsPerView]);

  // If there are no products, render nothing
  if (totalProducts === 0) return null;

  // If the product count is less than or equal to visible slots,
  // do NOT duplicate, do NOT slide, just display them statically as they are!
  const isSliderNeeded = totalProducts > cardsPerView;

  if (!isSliderNeeded) {
    const gridColsClass =
      cardsPerViewDesktop === 4
        ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4'
        : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5';

    return (
      <div className={`${gridColsClass} items-stretch`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onSelect={onSelect}
            onDirectBuy={onDirectBuy}
            onQuickView={onQuickView}
            onRequestProduct={onRequestProduct}
            onViewImage={onViewImage}
            isCompact={isCompact}
            sellerName={
              product.sellerId
                ? users.find((u) => u.id === product.sellerId)?.shopName ||
                  users.find((u) => u.id === product.sellerId)?.name
                : undefined
            }
          />
        ))}
      </div>
    );
  }

  // When sliding is needed, clone only cardsPerView items at the end for seamless looping
  const displayItems = [...products, ...products.slice(0, cardsPerView)];

  // Advance slide by 1 card from right to left
  const advanceSlide = useCallback(() => {
    setIsTransitionEnabled(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    if (currentIndex === 0) {
      // Jump seamlessly to totalProducts then animate backwards to totalProducts - 1
      setIsTransitionEnabled(false);
      setCurrentIndex(totalProducts);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitionEnabled(true);
          setCurrentIndex(totalProducts - 1);
        });
      });
    } else {
      setIsTransitionEnabled(true);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, totalProducts]);

  // Seamless jump back to 0 when reaching totalProducts
  useEffect(() => {
    if (currentIndex >= totalProducts) {
      const timeout = setTimeout(() => {
        setIsTransitionEnabled(false);
        setCurrentIndex(0);
      }, 720); // slightly after 700ms transition finishes
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, totalProducts]);

  // 5-second automatic sliding (pauses on hover)
  useEffect(() => {
    if (isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      advanceSlide();
    }, intervalSeconds * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, advanceSlide, intervalSeconds]);

  // Touch swipe support for mobile
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsHovered(true);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      if (diff > 40) {
        advanceSlide();
      } else if (diff < -40) {
        prevSlide();
      }
    }
    touchStartX.current = null;
    setIsHovered(false);
  };

  const itemWidthPercent = 100 / cardsPerView;
  const translateXPercent = currentIndex * itemWidthPercent;

  return (
    <div
      className="relative group/carousel select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel Track Container */}
      <div ref={containerRef} className="overflow-hidden py-1 -mx-1.5 px-1.5">
        <div
          className="flex"
          style={{
            transform: `translateX(-${translateXPercent}%)`,
            transition: isTransitionEnabled
              ? 'transform 700ms cubic-bezier(0.25, 1, 0.5, 1)'
              : 'none',
          }}
        >
          {displayItems.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="shrink-0 px-2 box-border flex flex-col"
              style={{ width: `${itemWidthPercent}%` }}
            >
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onSelect={onSelect}
                onDirectBuy={onDirectBuy}
                onQuickView={onQuickView}
                onRequestProduct={onRequestProduct}
                onViewImage={onViewImage}
                isCompact={isCompact}
                sellerName={
                  product.sellerId
                    ? users.find((u) => u.id === product.sellerId)?.shopName ||
                      users.find((u) => u.id === product.sellerId)?.name
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Floating subtle previous/next buttons (no text whatsoever) */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous"
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/95 hover:bg-white text-gray-700 shadow-md hover:shadow-lg flex items-center justify-center border border-gray-200 transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
      >
        <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <button
        type="button"
        onClick={advanceSlide}
        aria-label="Next"
        className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/95 hover:bg-white text-gray-700 shadow-md hover:shadow-lg flex items-center justify-center border border-gray-200 transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
      >
        <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
};

export default CategoryProductCarousel;
