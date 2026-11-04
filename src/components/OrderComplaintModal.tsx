import React, { useState } from 'react';
import { Complaint, Order, User, ComplaintCallLog } from '../types';
import { 
  X, AlertTriangle, CheckCircle2, Phone, PhoneCall, Clock, 
  UserCheck, ShieldAlert, FileText, Send, Sparkles, MessageSquare, 
  HelpCircle, ChevronRight, Check, AlertCircle, RefreshCw, DollarSign
} from 'lucide-react';

interface OrderComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | {
    id: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    district?: string;
    area?: string;
  };
  currentUser?: User | null;
  onAddComplaint: (complaint: Partial<Complaint>) => Promise<Complaint>;
  onSuccess?: (created: Complaint) => void;
}

export const ISSUE_CATEGORIES = [
  { id: 'damage', label: 'পণ্য ক্ষতিগ্রস্থ / নষ্ট', color: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'delay', label: 'ডেলিভারি বিলম্ব', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'wrong_item', label: 'ভুল বা কম পণ্য প্রাপ্তি', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'quality', label: 'পণ্যের গুণমান নিয়ে আপত্তি', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'price', label: 'বিল / মূল্য বা পেমেন্ট সংক্রান্ত', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'behavior', label: 'ডেলিভারি ম্যান বা আচরণ সংক্রান্ত', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'other', label: 'অন্যান্য সমস্যা', color: 'bg-gray-50 text-gray-700 border-gray-200' },
];

export const RESOLUTION_ACTIONS = [
  { id: 'replacement', label: 'নতুন পণ্য প্রতিস্থাপন (Replacement)' },
  { id: 'reshipped', label: 'বাকি পণ্য পুনরায় ডেলিভারি' },
  { id: 'refund', label: 'টাকা রিফান্ড (Full Refund)' },
  { id: 'partial_refund', label: 'আংশিক মূল্য ফেরত (Partial Refund)' },
  { id: 'discount_coupon', label: 'পরবর্তী অর্ডারে বিশেষ ডিসকাউন্ট / কুপন' },
  { id: 'explained', label: 'পরামর্শ প্রদান ও ভুল বোঝাবুঝি নিষ্পত্তি' },
  { id: 'other', label: 'অন্যান্য সমঝোতা' },
];

export function OrderComplaintModal({
  isOpen,
  onClose,
  order,
  currentUser,
  onAddComplaint,
  onSuccess
}: OrderComplaintModalProps) {
  // Extract pure phone without alt text
  const initialPhone = order.customerPhone ? order.customerPhone.split(' ')[0].replace(/[^\d+]/g, '') : '';
  
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [orderId, setOrderId] = useState(order.id || '');
  const [customerAddress, setCustomerAddress] = useState(order.deliveryAddress || '');
  const [issueCategory, setIssueCategory] = useState('damage');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successComplaint, setSuccessComplaint] = useState<Complaint | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerPhone.trim()) {
      setError('গ্রাহকের মোবাইল নম্বর প্রদান করা আবশ্যক!');
      return;
    }
    if (!description.trim()) {
      setError('অভিযোগের বিস্তারিত কারণ বা বিবরণ লিখুন!');
      return;
    }

    setIsSubmitting(true);
    try {
      const catObj = ISSUE_CATEGORIES.find(c => c.id === issueCategory);
      const created = await onAddComplaint({
        orderId: orderId.trim() || undefined,
        customerName: customerName.trim() || 'সম্মানিত গ্রাহক',
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim() || undefined,
        issueCategory,
        issueCategoryLabel: catObj ? catObj.label : 'অন্যান্য সমস্যা',
        priority,
        description: description.trim(),
        assignedRepresentative: currentUser?.name || 'কাস্টমার কেয়ার টিম',
        status: 'pending'
      });

      setSuccessComplaint(created);
      if (onSuccess) onSuccess(created);
    } catch (err: any) {
      setError(err?.message || 'অভিযোগ জমা দিতে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-fadeIn">
      <div className="bg-white border-2 border-rose-200 rounded-3xl p-5 md:p-7 shadow-2xl relative max-w-xl w-full max-h-[92vh] overflow-y-auto space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {successComplaint ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-black text-slate-900">
                কম্পেলেইন সফলভাবে নথিভুক্ত হয়েছে!
              </h4>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                অভিযোগ ট্র্যাকিং আইডি: <span className="font-mono font-black text-rose-600">{successComplaint.id}</span>
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left text-xs space-y-2 text-amber-950">
              <p><strong className="text-slate-700">গ্রাহকের মোবাইল:</strong> {successComplaint.customerPhone}</p>
              <p><strong className="text-slate-700">অর্ডার নম্বর:</strong> {successComplaint.orderId || 'সংযুক্ত নেই'}</p>
              <p><strong className="text-slate-700">সমস্যার ধরন:</strong> {successComplaint.issueCategoryLabel}</p>
              <p><strong className="text-slate-700">বিস্তারিত নোট:</strong> {successComplaint.description}</p>
            </div>
            <p className="text-xs text-emerald-700 font-bold">
              আমাদের সাপোর্ট টিম খুব শীঘ্রই কাস্টমারের সাথে ফোনে যোগাযোগ করে সমস্যা সমাধান নিশ্চিত করবে।
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#006437] hover:bg-[#004d2a] text-white font-extrabold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-xs"
            >
              ঠিক আছে
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-rose-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm md:text-base">
                  অভিযোগ / কম্পেলেইন জমা দিন
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  অর্ডার সংক্রান্ত যে কোনো সমস্যা সরাসরি সাপোর্ট টিমের নিকট পৌঁছাতে ফর্মটি পূরণ করুন
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Phone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  গ্রাহকের মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  গ্রাহকের নাম
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="গ্রাহকের নাম লিখুন"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                />
              </div>

              {/* Order ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  অর্ডার আইডি
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="যেমন: ML-123456"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  অগ্রাধিকার (Priority)
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
                >
                  <option value="normal">সাধারণ (Normal)</option>
                  <option value="high">জরুরি (High)</option>
                  <option value="urgent">অতি জরুরি (Urgent)</option>
                </select>
              </div>

              {/* Delivery Address */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  গ্রাহকের ঠিকানা
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              {/* Issue Category */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  সমস্যার ধরন <span className="text-red-500">*</span>
                </label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
                >
                  {ISSUE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Detailed Description */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  বিস্তারিত কারণ / অভিযোগের বিবরণ <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="গ্রাহকের কী সমস্যা হয়েছে এবং কী সমাধান চান তা বিস্তারিত লিখুন..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'জমা হচ্ছে...' : 'কম্পেলেইন জমা দিন'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COMPLAINT & CALL LOG DETAILS MODAL (VIEW FROM MEMO DIRECTLY)
// -------------------------------------------------------------
interface OrderComplaintHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | {
    id: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
  };
  complaints: Complaint[];
  currentUser?: User | null;
  onAddCallLog?: (complaintId: string, log: { representativeName: string; notes: string; customerResponse?: string }) => Promise<Complaint>;
  onUpdateComplaint?: (complaint: Complaint) => Promise<Complaint>;
  onOpenCreateComplaint?: () => void;
}

export function OrderComplaintHistoryModal({
  isOpen,
  onClose,
  order,
  complaints,
  currentUser,
  onAddCallLog,
  onUpdateComplaint,
  onOpenCreateComplaint
}: OrderComplaintHistoryModalProps) {
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Sub-forms inside history
  const [showAddCall, setShowAddCall] = useState(false);
  const [repName, setRepName] = useState(currentUser?.name || 'কাস্টমার সাপোর্ট');
  const [callNotes, setCallNotes] = useState('');
  const [callSentiment, setCallSentiment] = useState<'satisfied' | 'neutral' | 'unhappy' | 'followup_needed'>('satisfied');
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);

  // Resolution Sub-form
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveAction, setResolveAction] = useState('replacement');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveRefundAmt, setResolveRefundAmt] = useState<number | ''>('');
  const [resolveSatisfied, setResolveSatisfied] = useState(true);
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  if (!isOpen) return null;

  const phoneQuery = order.customerPhone ? order.customerPhone.replace(/[^\d]/g, '') : '';
  const orderIdQuery = order.id ? order.id.toUpperCase() : '';

  // Filter complaints related to this order or customer
  const matchedComplaints = complaints.filter(c => {
    if (orderIdQuery && c.orderId && c.orderId.toUpperCase().includes(orderIdQuery)) return true;
    if (phoneQuery && c.customerPhone) {
      const cPhone = c.customerPhone.replace(/[^\d]/g, '');
      if (cPhone.length >= 8 && (cPhone.includes(phoneQuery) || phoneQuery.includes(cPhone))) return true;
    }
    return false;
  });

  const activeComplaint = selectedComplaintId
    ? matchedComplaints.find(c => c.id === selectedComplaintId) || matchedComplaints[0]
    : matchedComplaints[0];

  const handleSaveCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint || !onAddCallLog) return;
    if (!callNotes.trim()) return;

    setIsSubmittingCall(true);
    try {
      await onAddCallLog(activeComplaint.id, {
        representativeName: repName.trim() || 'কাস্টমার সাপোর্ট',
        notes: callNotes.trim(),
        customerResponse: callSentiment
      });
      setCallNotes('');
      setShowAddCall(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingCall(false);
    }
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint || !onUpdateComplaint) return;

    setIsSubmittingResolve(true);
    try {
      const actObj = RESOLUTION_ACTIONS.find(a => a.id === resolveAction);
      const updated: Complaint = {
        ...activeComplaint,
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolution: {
          actionTaken: resolveAction as any,
          actionLabel: actObj ? actObj.label : 'সমাধান সম্পন্ন',
          resolvedBy: repName.trim() || 'কাস্টমার ম্যানেজার',
          resolvedAt: new Date().toISOString(),
          notes: resolveNotes.trim(),
          refundAmount: resolveRefundAmt !== '' ? Number(resolveRefundAmt) : undefined,
          isCustomerSatisfied: resolveSatisfied
        }
      };
      await onUpdateComplaint(updated);
      setShowResolveForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-fadeIn">
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 md:p-7 shadow-2xl relative max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm md:text-base">
                অর্ডারের অভিযোগ, নোট ও কল হিস্ট্রি
              </h4>
              <p className="text-[11px] text-slate-500 font-bold font-sans">
                অর্ডার: #{order.id} | গ্রাহক: {order.customerName} ({order.customerPhone})
              </p>
            </div>
          </div>

          {onOpenCreateComplaint && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateComplaint();
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>+ নতুন কম্পেলেইন লিখুন</span>
            </button>
          )}
        </div>

        {matchedComplaints.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h5 className="font-black text-slate-800 text-sm">এই অর্ডারের বিপরীতে কোনো সক্রিয় অভিযোগ নেই!</h5>
              <p className="text-xs text-slate-500 mt-1">সবকিছু স্বাভাবিক রয়েছে। কোনো সমস্যা হলে অভিযোগ জমা দিতে পারেন।</p>
            </div>
            {onOpenCreateComplaint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateComplaint();
                }}
                className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>কম্পেলেইন জমা দিন</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Multiple complaints tab pills if more than 1 */}
            {matchedComplaints.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {matchedComplaints.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedComplaintId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                      activeComplaint?.id === c.id
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {c.id} ({c.issueCategoryLabel})
                  </button>
                ))}
              </div>
            )}

            {activeComplaint && (
              <div className="space-y-4 text-xs">
                {/* Status & Summary Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 font-mono text-sm">{activeComplaint.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                        activeComplaint.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : activeComplaint.status === 'in_progress'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {activeComplaint.status === 'resolved' ? '✓ সমাধান সম্পন্ন' :
                         activeComplaint.status === 'in_progress' ? 'প্রক্রিয়াধীন (In Progress)' : 'অপেক্ষমাণ (Pending)'}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500">
                      তারিখ: {new Date(activeComplaint.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <p><strong className="text-slate-500">সমস্যার ধরন:</strong> <span className="font-black text-rose-700">{activeComplaint.issueCategoryLabel}</span></p>
                    <p><strong className="text-slate-500">অগ্রাধিকার:</strong> <span className="font-bold uppercase">{activeComplaint.priority}</span></p>
                    <p className="sm:col-span-2"><strong className="text-slate-500">অভিযোগের বিবরণ:</strong> <span className="font-medium text-slate-900">{activeComplaint.description}</span></p>
                  </div>
                </div>

                {/* Call Tracking & Interactions Section */}
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-emerald-600" />
                      <h5 className="font-black text-slate-900 text-xs">
                        কল রেকর্ড ও প্রতিনিধির তথ্য (Call Tracking: {activeComplaint.callLogs ? activeComplaint.callLogs.length : 0} বার)
                      </h5>
                    </div>

                    {onAddCallLog && (
                      <button
                        type="button"
                        onClick={() => setShowAddCall(!showAddCall)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{showAddCall ? 'ফর্ম লুকান' : '+ নতুন কল রেকর্ড করুন'}</span>
                      </button>
                    )}
                  </div>

                  {/* Add Call Log Sub-form */}
                  {showAddCall && (
                    <form onSubmit={handleSaveCall} className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-2.5 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">প্রতিনিধির নাম</label>
                          <input
                            type="text"
                            value={repName}
                            onChange={(e) => setRepName(e.target.value)}
                            placeholder="প্রতিনিধির নাম"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-slate-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">কাস্টমারের প্রতিক্রিয়া</label>
                          <select
                            value={callSentiment}
                            onChange={(e) => setCallSentiment(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-slate-800 text-xs"
                          >
                            <option value="satisfied">😊 সন্তুষ্ট (Satisfied)</option>
                            <option value="neutral">😐 স্বাভাবিক (Neutral)</option>
                            <option value="unhappy">😠 অসন্তুষ্ট (Unhappy)</option>
                            <option value="followup_needed">⏳ ফলো-আপ প্রয়োজন</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">আলোচনার সারসংক্ষেপ *</label>
                        <textarea
                          rows={2}
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          placeholder="গ্রাহকের সাথে কী আলোচনা হলো এবং কী পরামর্শ দেওয়া হলো তা লিখুন..."
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-medium text-slate-800 text-xs resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddCall(false)}
                          className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          বাতিল
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingCall}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-black cursor-pointer disabled:opacity-60"
                        >
                          {isSubmittingCall ? 'সেভ হচ্ছে...' : 'কল রেকর্ড সেভ করুন'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Existing Call Logs List with Bangla Counter (১ম কল, ২য় কল ইত্যাদি) */}
                  {(!activeComplaint.callLogs || activeComplaint.callLogs.length === 0) ? (
                    <p className="text-slate-400 text-[11px] italic py-1">এখনো কোনো কল রেকর্ড নথিভুক্ত করা হয়নি।</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activeComplaint.callLogs.map((log, idx) => {
                        const callCountLabels = ['১ম কল', '২য় কল', '৩য় কল', '৪র্থ কল', '৫ম কল', '৬ষ্ঠ কল', '৭ম কল', '৮ম কল'];
                        const callLabel = callCountLabels[idx] || `${idx + 1}তম কল`;
                        return (
                          <div key={log.id || idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px]">
                                  {callLabel}
                                </span>
                                <span className="font-extrabold text-slate-900">{log.representativeName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(log.calledAt).toLocaleString('bn-BD')}
                              </span>
                            </div>
                            <p className="text-slate-700 font-medium text-[11px]">{log.notes}</p>
                            {log.customerResponse && (
                              <div className="pt-1 text-[10px] font-bold text-slate-500">
                                গ্রাহকের প্রতিক্রিয়া: <span className="text-emerald-700 font-extrabold">{
                                  log.customerResponse === 'satisfied' ? 'সন্তুষ্ট' :
                                  log.customerResponse === 'unhappy' ? 'অসন্তুষ্ট' :
                                  log.customerResponse === 'followup_needed' ? 'ফলো-আপ প্রয়োজন' : 'স্বাভাবিক'
                                }</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Resolution Workflow Section */}
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h5 className="font-black text-slate-900 text-xs">
                        সমাধানের বিবরণ (Resolution Workflow)
                      </h5>
                    </div>

                    {onUpdateComplaint && activeComplaint.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => setShowResolveForm(!showResolveForm)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[11px] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>{showResolveForm ? 'ফর্ম লুকান' : 'সমাধান সম্পন্ন করুন'}</span>
                      </button>
                    )}
                  </div>

                  {/* Resolution Form */}
                  {showResolveForm && (
                    <form onSubmit={handleSaveResolution} className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2.5 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">পদক্ষেপ (Action Taken) *</label>
                          <select
                            value={resolveAction}
                            onChange={(e) => setResolveAction(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-slate-800 text-xs"
                          >
                            {RESOLUTION_ACTIONS.map(act => (
                              <option key={act.id} value={act.id}>{act.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">রিফান্ড টাকা (যদি প্রযোজ্য হয়)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="যেমন: ৫০০"
                            value={resolveRefundAmt}
                            onChange={(e) => setResolveRefundAmt(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-slate-800 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">রেজুলেশন বিস্তারিত নোট *</label>
                        <textarea
                          rows={2}
                          value={resolveNotes}
                          onChange={(e) => setResolveNotes(e.target.value)}
                          placeholder="কীভাবে সমস্যার চূড়ান্ত সমাধান হলো এবং গ্রাহক কীভাবে সম্মত হলেন..."
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-medium text-slate-800 text-xs resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-[11px]">
                          <input
                            type="checkbox"
                            checked={resolveSatisfied}
                            onChange={(e) => setResolveSatisfied(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <span>গ্রাহক শতভাগ সন্তুষ্ট হয়েছেন</span>
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowResolveForm(false)}
                            className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingResolve}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-black cursor-pointer disabled:opacity-60"
                          >
                            {isSubmittingResolve ? 'সেভ হচ্ছে...' : 'রেজুলেশন নিশ্চিত করুন'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {activeComplaint.resolution ? (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-black text-emerald-900 text-xs">
                          {activeComplaint.resolution.actionLabel || 'সমাধান সম্পন্ন'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          সমাধানকারী: {activeComplaint.resolution.resolvedBy}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium text-[11px]">{activeComplaint.resolution.notes}</p>
                      {activeComplaint.resolution.refundAmount && (
                        <p className="font-extrabold text-rose-700 text-[11px]">
                          রিফান্ড টাকার পরিমাণ: ৳{activeComplaint.resolution.refundAmount}
                        </p>
                      )}
                      {activeComplaint.resolution.isCustomerSatisfied && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                          <Check className="w-3 h-3 text-emerald-600" /> গ্রাহক পুরোপুরি সন্তুষ্ট হয়েছেন
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-[11px] italic">অভিযোগটি এখনো সমাধান করা হয়নি।</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
