import type React from 'react';

/**
 * Fallback logo image for products without pictures or on broken image loads
 */
export const DEFAULT_PRODUCT_PLACEHOLDER = '/assets/aistudio/image_f57a69c5.png';

export const getValidImageSrc = (src?: string | null): string => {
  if (
    !src ||
    typeof src !== 'string' ||
    src.trim() === '' ||
    src.includes('placeholder') ||
    src.includes('undefined') ||
    src === 'null' ||
    src.includes('image_17ba70eb.png') ||
    src.includes('photo-1553279768-865429fa0078')
  ) {
    return DEFAULT_PRODUCT_PLACEHOLDER;
  }
  return src.trim();
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_PRODUCT_PLACEHOLDER && !target.src.endsWith(DEFAULT_PRODUCT_PLACEHOLDER)) {
    target.src = DEFAULT_PRODUCT_PLACEHOLDER;
  }
};
