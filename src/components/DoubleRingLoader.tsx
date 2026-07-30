import React from 'react';

interface DoubleRingLoaderProps {
  text?: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function DoubleRingLoader({
  text = '',
  subtext = '',
  size = 'md',
  fullScreen = false,
}: DoubleRingLoaderProps) {
  // Disabled loading animation per user instruction
  return null;
}
