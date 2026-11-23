import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'হ্যাঁ, ডিলিট করুন',
  cancelLabel = 'বাতিল',
  isProcessing = false,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 backdrop-blur-xs"
      onClick={() => {
        if (!isProcessing) onCancel();
      }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-red-100 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="font-extrabold text-gray-900 text-sm md:text-base">{title}</h3>
          <div className="text-xs text-gray-600 leading-relaxed font-medium">{description}</div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className="flex-1 py-2.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isProcessing ? 'ডিলিট হচ্ছে...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
