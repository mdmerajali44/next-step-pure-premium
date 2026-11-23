/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Leaf, ShieldCheck, Sun, Star } from 'lucide-react';

export const SideHeritageDecorPanels: React.FC = () => {
  return (
    <>
      {/* Left Side Heritage Decor Panel */}
      <aside className="hidden xl:block fixed left-0 top-0 bottom-0 w-24 bg-gradient-to-b from-[#fffbeb] via-[#fef3c7] to-[#fffbeb] border-r-2 border-amber-300/80 z-30 shadow-md select-none pointer-events-none overflow-hidden">
        {/* Top Ornate Crown */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-orange-600 to-amber-600 text-white flex flex-col items-center justify-center p-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
            <span className="text-sm">🥭</span>
          </div>
          <span className="text-[10px] font-black tracking-widest text-amber-100 uppercase writing-mode-vertical">সাতক্ষীরা</span>
        </div>

        {/* Repeating Vertical Traditional Motifs & Artwork */}
        <div className="absolute top-32 bottom-28 left-0 right-0 flex flex-col items-center justify-around py-4 overflow-hidden opacity-85">
          <div className="flex flex-col items-center gap-2 text-amber-800">
            <span className="text-xl">🌾</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-orange-700">
            <span className="text-xl">🍯</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-emerald-700">
            <span className="text-xl">🌿</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-amber-900">
            <span className="text-xl">🏺</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-orange-600">
            <span className="text-xl">🥭</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-amber-700">
            <span className="text-xl">🪷</span>
          </div>
        </div>

        {/* Bottom Ornate Foot */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-amber-900 to-amber-700 text-amber-200 flex flex-col items-center justify-center p-2 text-center">
          <span className="text-[9px] font-bold tracking-tight">শতভাগ খাঁটি</span>
          <span className="text-[8px] text-amber-300">অর্গানিক</span>
        </div>
      </aside>

      {/* Right Side Heritage Decor Panel */}
      <aside className="hidden xl:block fixed right-0 top-0 bottom-0 w-24 bg-gradient-to-b from-[#fffbeb] via-[#fef3c7] to-[#fffbeb] border-l-2 border-amber-300/80 z-30 shadow-md select-none pointer-events-none overflow-hidden">
        {/* Top Ornate Crown */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-orange-600 to-amber-600 text-white flex flex-col items-center justify-center p-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
            <span className="text-sm">🍯</span>
          </div>
          <span className="text-[10px] font-black tracking-widest text-amber-100 uppercase">প্রিমিয়াম</span>
        </div>

        {/* Repeating Vertical Traditional Motifs & Artwork */}
        <div className="absolute top-32 bottom-28 left-0 right-0 flex flex-col items-center justify-around py-4 overflow-hidden opacity-85">
          <div className="flex flex-col items-center gap-2 text-orange-600">
            <span className="text-xl">🥭</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-amber-900">
            <span className="text-xl">🏺</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-emerald-700">
            <span className="text-xl">🌿</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-orange-700">
            <span className="text-xl">🍯</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-amber-800">
            <span className="text-xl">🌾</span>
            <div className="w-0.5 h-12 bg-amber-300/80 dashed" />
          </div>
          <div className="flex flex-col items-center gap-2 text-amber-700">
            <span className="text-xl">🪷</span>
          </div>
        </div>

        {/* Bottom Ornate Foot */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-amber-900 to-amber-700 text-amber-200 flex flex-col items-center justify-center p-2 text-center">
          <span className="text-[9px] font-bold tracking-tight">বাংলাদেশী</span>
          <span className="text-[8px] text-amber-300">ঐতিহ্য</span>
        </div>
      </aside>
    </>
  );
};

export default SideHeritageDecorPanels;
