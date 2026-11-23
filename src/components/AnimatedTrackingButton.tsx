/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Truck } from 'lucide-react';

interface AnimatedTrackingButtonProps {
  onClick: () => void;
}

export const AnimatedTrackingButton: React.FC<AnimatedTrackingButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="h-11 px-4 bg-[#e6f4ea] hover:bg-[#d2ebd9] text-[#006437] rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
      title="অর্ডার ট্র্যাকিং"
    >
      <Truck className="w-4 h-4 text-[#006437] shrink-0" />
      <span className="text-xs sm:text-sm font-black tracking-tight whitespace-nowrap text-[#006437]">
        অর্ডার ট্র্যাকিং
      </span>
    </button>
  );
};
