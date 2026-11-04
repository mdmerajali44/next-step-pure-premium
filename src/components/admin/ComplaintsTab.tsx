import React, { useState, useMemo } from 'react';
import { Complaint, Order, User, ComplaintCallLog, matchesSearchWithNumerals } from '../../types';
import { 
  AlertTriangle, Phone, PhoneCall, CheckCircle2, Clock, UserCheck, 
  Search, Plus, X, MessageSquare, ShieldAlert, ArrowRight,
  Filter, Calendar, ExternalLink, RefreshCw, Trash2, Check,
  Sparkles, FileText, ChevronRight, User as UserIcon, HelpCircle
} from 'lucide-react';

interface ComplaintsTabProps {
  complaints: Complaint[];
  orders: Order[];
  loggedInUser?: User | null;
  onAddComplaint: (complaint: Partial<Complaint>) => Promise<Complaint>;
  onUpdateComplaint: (complaint: Complaint) => Promise<Complaint>;
  onDeleteComplaint: (id: string) => Promise<boolean>;
  onAddCallLog: (complaintId: string, log: { representativeName: string; notes: string; customerResponse?: string }) => Promise<Complaint>;
  onViewOrderDetails?: (order: Order) => void;
  notify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  prefillPhone?: string;
  prefillOrderId?: string;
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

export const ACTION_OPTIONS = [
  { id: 'replacement', label: 'নতুন পণ্য প্রতিস্থাপন (Replacement)' },
  { id: 'reshipped', label: 'বাকি পণ্য পুনরায় ডেলিভারি' },
  { id: 'refund', label: 'টাকা রিফান্ড (Full Refund)' },
  { id: 'partial_refund', label: 'আংশিক মূল্য ফেরত (Partial Refund)' },
  { id: 'discount_coupon', label: 'পরবর্তী অর্ডারে বিশেষ ডিসকাউন্ট / কুপন' },
  { id: 'explained', label: 'পরামর্শ প্রদান ও ভুল বোঝাবুঝি নিষ্পত্তি' },
  { id: 'other', label: 'অন্যান্য সমঝোতা' },
];

export const ComplaintsTab: React.FC<ComplaintsTabProps> = ({
  complaints,
  orders,
  loggedInUser,
  onAddComplaint,
  onUpdateComplaint,
  onDeleteComplaint,
  onAddCallLog,
  onViewOrderDetails,
  notify = (_msg: string, _type?: 'success' | 'info' | 'error') => {},
  prefillPhone,
  prefillOrderId
}) => {
  const [searchQuery, setSearchQuery] = useState(prefillPhone || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  
  // Log Call Sub-modal
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [callLogRepresentative, setCallLogRepresentative] = useState(loggedInUser?.name || 'কাস্টমার সাপোর্ট');
  const [callLogNotes, setCallLogNotes] = useState('');
  const [callLogResponse, setCallLogResponse] = useState<'satisfied' | 'neutral' | 'unhappy' | 'followup_needed'>('satisfied');
  
  // Resolution Sub-modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveAction, setResolveAction] = useState('replacement');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveRepresentative, setResolveRepresentative] = useState(loggedInUser?.name || 'কাস্টমার ম্যানেজার');
  const [resolveRefundAmount, setResolveRefundAmount] = useState<number | ''>('');
  const [resolveIsSatisfied, setResolveIsSatisfied] = useState(true);

  // New Complaint Form state
  const [newCustPhone, setNewCustPhone] = useState(prefillPhone || '');
  const [newCustName, setNewCustName] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newOrderId, setNewOrderId] = useState(prefillOrderId || '');
  const [newIssueCategory, setNewIssueCategory] = useState('damage');
  const [newPriority, setNewPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [newDescription, setNewDescription] = useState('');
  const [newRepresentative, setNewRepresentative] = useState(loggedInUser?.name || 'অ্যাডমিন সাপোর্ট');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill customer info when phone matches existing order
  const matchedPhoneOrders = useMemo(() => {
    if (!newCustPhone || newCustPhone.trim().length < 4) return [];
    const clean = newCustPhone.trim();
    return orders.filter(o => 
      o.customerPhone && (o.customerPhone.includes(clean) || clean.includes(o.customerPhone))
    );
  }, [newCustPhone, orders]);

  const handlePhoneLookup = (phone: string) => {
    setNewCustPhone(phone);
    if (!phone.trim()) return;
    const clean = phone.trim();
    const matched = orders.filter(o => 
      o.customerPhone && (o.customerPhone.includes(clean) || clean.includes(o.customerPhone))
    );
    if (matched.length > 0) {
      const matchedOrder = matched[0];
      setNewCustName(matchedOrder.customerName);
      setNewCustAddress(`${matchedOrder.deliveryAddress}, ${matchedOrder.area ? matchedOrder.area + ', ' : ''}${matchedOrder.district}`);
      setNewOrderId(matchedOrder.id);
    }
  };

  const handleSelectCustomerOrder = (ord: Order) => {
    setNewOrderId(ord.id);
    setNewCustName(ord.customerName);
    setNewCustAddress(`${ord.deliveryAddress}, ${ord.area ? ord.area + ', ' : ''}${ord.district}`);
  };

  // Convert English number to Bengali number
  const toBn = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '০';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, d => bnDigits[parseInt(d, 10)]);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    return { total, pending, inProgress, resolved };
  }, [complaints]);

  // Filtered list
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      // Category filter
      if (categoryFilter !== 'all' && c.issueCategory !== categoryFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim();
        const matchPhone = matchesSearchWithNumerals(c.customerPhone, q);
        const matchName = matchesSearchWithNumerals(c.customerName, q);
        const matchId = matchesSearchWithNumerals(c.id, q);
        const matchOrder = c.orderId && matchesSearchWithNumerals(c.orderId, q);
        const matchDesc = matchesSearchWithNumerals(c.description, q);
        if (!matchPhone && !matchName && !matchId && !matchOrder && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, statusFilter, categoryFilter, searchQuery]);

  // Submit New Complaint
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustPhone.trim()) {
      notify('গ্রাহকের মোবাইল নম্বর দিন', 'error');
      return;
    }
    if (!newDescription.trim()) {
      notify('অভিযোগ বা সমস্যার বিস্তারিত বিবরণ দিন', 'error');
      return;
    }

    const catObj = ISSUE_CATEGORIES.find(c => c.id === newIssueCategory);

    setIsSubmitting(true);
    try {
      const created = await onAddComplaint({
        customerName: newCustName.trim() || 'গ্রাহক',
        customerPhone: newCustPhone.trim(),
        customerAddress: newCustAddress.trim(),
        orderId: newOrderId.trim() || undefined,
        issueCategory: newIssueCategory as any,
        issueCategoryLabel: catObj ? catObj.label : 'সাধারণ সমস্যা',
        description: newDescription.trim(),
        priority: newPriority,
        status: 'pending',
        createdBy: newRepresentative.trim() || 'অ্যাডমিন',
        callLogs: []
      });

      notify(`কম্পেলেইন #${created.id} সফলভাবে জমা হয়েছে!`, 'success');
      setShowCreateModal(false);
      // Reset form
      setNewCustPhone('');
      setNewCustName('');
      setNewCustAddress('');
      setNewOrderId('');
      setNewDescription('');
    } catch (err: any) {
      notify(err?.message || 'কম্পেলেইন জমা দিতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Call Log
  const handleSaveCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!callLogNotes.trim()) {
      notify('কলের আলোচনার সারসংক্ষেপ লিখুন', 'error');
      return;
    }

    try {
      const updated = await onAddCallLog(selectedComplaint.id, {
        representativeName: callLogRepresentative.trim() || 'প্রতিনিধি',
        notes: callLogNotes.trim(),
        customerResponse: callLogResponse
      });

      setSelectedComplaint(updated);
      setShowLogCallModal(false);
      setCallLogNotes('');
      notify('নতুন কল রেকর্ড সফলভাবে যুক্ত হয়েছে!', 'success');
    } catch (e: any) {
      notify(e?.message || 'কল রেকর্ড সংরক্ষণে ব্যর্থ হয়েছে', 'error');
    }
  };

  // Submit Resolution
  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!resolveNotes.trim()) {
      notify('কীভাবে সমস্যা সমাধান করা হলো তা লিখুন', 'error');
      return;
    }

    const actionObj = ACTION_OPTIONS.find(a => a.id === resolveAction);

    const updatedComplaint: Complaint = {
      ...selectedComplaint,
      status: 'resolved',
      updatedAt: new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD'),
      resolution: {
        resolvedAt: new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD'),
        resolvedBy: resolveRepresentative.trim() || 'প্রতিনিধি',
        actionTaken: resolveAction as any,
        actionTakenLabel: actionObj ? actionObj.label : 'সমাধান সম্পন্ন',
        resolutionNotes: resolveNotes.trim(),
        isCustomerSatisfied: resolveIsSatisfied,
        refundAmount: typeof resolveRefundAmount === 'number' ? resolveRefundAmount : undefined
      }
    };

    try {
      const saved = await onUpdateComplaint(updatedComplaint);
      setSelectedComplaint(saved);
      setShowResolveModal(false);
      notify(`কম্পেলেইন #${saved.id} সফলভাবে সমাধান হিসেবে চিহ্নিত হয়েছে!`, 'success');
    } catch (e: any) {
      notify(e?.message || 'সমাধান সংরক্ষণে সমস্যা হয়েছে', 'error');
    }
  };

  // Quick Status change
  const handleQuickStatusChange = async (complaint: Complaint, newStatus: Complaint['status']) => {
    if (newStatus === 'resolved') {
      setSelectedComplaint(complaint);
      setShowResolveModal(true);
      return;
    }

    try {
      const updated: Complaint = {
        ...complaint,
        status: newStatus,
        updatedAt: new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD')
      };
      const saved = await onUpdateComplaint(updated);
      if (selectedComplaint?.id === saved.id) {
        setSelectedComplaint(saved);
      }
      notify(`স্ট্যাটাস পরিবর্তন সম্পন্ন হয়েছে`, 'success');
    } catch (e: any) {
      notify('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Stats */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-600 rounded-3xl p-5 md:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-black">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>কাস্টমার কেয়ার ও অভিযোগ সেল</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              গ্রাহক সমস্যা সমাধান ও কম্পেলেইন সেন্টার
            </h2>
            <p className="text-xs md:text-sm text-white/90 font-medium max-w-xl">
              মোবাইল নম্বর সার্চ করে অর্ডার খুঁজে সমস্যা নোট করুন, কল হিস্ট্রি ট্র্যাক করুন এবং প্রতিনিধির মাধ্যমে প্রফেশনাল সমাধান দিন।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setNewCustPhone(searchQuery);
                setShowCreateModal(true);
              }}
              className="bg-white text-orange-600 hover:bg-orange-50 font-black text-xs md:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>নতুন কম্পেলেইন এন্ট্রি</span>
            </button>
          </div>
        </div>

        {/* KPI Mini Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/20 text-white">
          <div className="bg-white/15 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <span className="text-[11px] font-bold opacity-80 block">মোট কম্পেলেইন</span>
            <span className="text-xl md:text-2xl font-black font-sans">{toBn(stats.total)}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <span className="text-[11px] font-bold opacity-80 block">অমীমাংসিত (নতুন)</span>
            <span className="text-xl md:text-2xl font-black font-sans text-amber-200">{toBn(stats.pending)}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <span className="text-[11px] font-bold opacity-80 block">তদন্ত ও আলোচনা চলছে</span>
            <span className="text-xl md:text-2xl font-black font-sans text-sky-200">{toBn(stats.inProgress)}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <span className="text-[11px] font-bold opacity-80 block">সমাধান সম্পন্ন</span>
            <span className="text-xl md:text-2xl font-black font-sans text-emerald-200">{toBn(stats.resolved)}</span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="গ্রাহকের মোবাইল নম্বর, নাম বা কম্পেলেইন/অর্ডার আইডি দিয়ে সার্চ করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs md:text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-gray-500 hover:text-red-600 bg-gray-200 hover:bg-red-50 px-2 py-1 rounded-lg cursor-pointer"
              >
                মুছুন ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
              >
                সব ({toBn(complaints.length)})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs font-black' : 'text-gray-500 hover:text-gray-900'}`}
              >
                নতুন ({toBn(stats.pending)})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'in_progress' ? 'bg-white text-sky-700 shadow-xs font-black' : 'text-gray-500 hover:text-gray-900'}`}
              >
                চলমান ({toBn(stats.inProgress)})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'resolved' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-gray-500 hover:text-gray-900'}`}
              >
                সমাধানকৃত ({toBn(stats.resolved)})
              </button>
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">সব ধরনের সমস্যা</option>
              {ISSUE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* If customer phone search matches orders, show instant quick banner */}
        {searchQuery.trim().length >= 4 && (() => {
          const matchedOrders = orders.filter(o => 
            o.customerPhone && o.customerPhone.includes(searchQuery.trim())
          );
          if (matchedOrders.length === 0) return null;
          const first = matchedOrders[0];
          return (
            <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-gray-900">
                    গ্রাহক: {first.customerName} | মোবাইল: <span className="font-sans font-bold text-orange-700">{first.customerPhone}</span>
                  </p>
                  <p className="text-[11px] text-gray-500">
                    এই গ্রাহকের মোট <strong className="text-gray-800 font-sans">{toBn(matchedOrders.length)}</strong> টি অর্ডার রয়েছে।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${first.customerPhone}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>কল করুন</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    handlePhoneLookup(first.customerPhone);
                    setShowCreateModal(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>কম্পেলেইন তুলুন</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Complaints Cards List */}
      {filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3 shadow-xs">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="font-black text-gray-800 text-lg">কোনো কম্পেলেইন বা অভিযোগ পাওয়া যায়নি</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery ? 'আপনার সার্চকৃত তথ্যের সাথে কোনো অভিযোগ মেলেনি।' : 'আলহামদুলিল্লাহ! বর্তমানে কোনো সমাধানহীন অভিযোগ নেই।'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-orange-600 font-bold hover:underline"
            >
              সকল অভিযোগ দেখুন
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredComplaints.map((c) => {
            const catObj = ISSUE_CATEGORIES.find(cat => cat.id === c.issueCategory);
            const callCount = c.callLogs?.length || 0;
            const linkedOrder = c.orderId ? orders.find(o => o.id === c.orderId) : null;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border p-5 transition-all duration-200 space-y-4 hover:shadow-md ${
                  c.status === 'resolved' 
                    ? 'border-emerald-200 bg-emerald-50/10' 
                    : c.status === 'in_progress' 
                    ? 'border-sky-200 bg-sky-50/10' 
                    : 'border-orange-200 bg-white'
                }`}
              >
                {/* Top Badge & ID Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black font-sans px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800">
                        #{c.id}
                      </span>
                      
                      {/* Status Badge */}
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'in_progress' ? 'bg-sky-100 text-sky-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status === 'resolved' ? '✓ সমাধান সম্পন্ন' :
                         c.status === 'in_progress' ? '● আলোচনা চলছে' :
                         '⏳ অপেক্ষমাণ'}
                      </span>

                      {/* Priority */}
                      {c.priority === 'urgent' && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-700 animate-pulse">
                          অতি জরুরি
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-400">
                      তারিখ: <span className="font-semibold text-gray-600">{c.createdAt}</span> | এন্ট্রি: <span className="font-semibold text-gray-700">{c.createdBy}</span>
                    </p>
                  </div>

                  {/* Category Pill */}
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${catObj ? catObj.color : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {c.issueCategoryLabel || catObj?.label || 'অভিযোগ'}
                  </span>
                </div>

                {/* Customer Details Block */}
                <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-gray-900 text-sm">
                        {c.customerName}
                      </p>
                      <p className="text-xs text-orange-600 font-bold font-sans flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {c.customerPhone}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${c.customerPhone}`}
                        className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl transition-all shadow-3xs cursor-pointer"
                        title="সরাসরি কল দিন"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/88${c.customerPhone.replace(/^(\+88|0)/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white rounded-xl transition-all shadow-3xs cursor-pointer"
                        title="WhatsApp মেসেজ"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {c.customerAddress && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 border-t border-gray-200/60 pt-1.5">
                      ঠিকানা: <span className="text-gray-700 font-medium">{c.customerAddress}</span>
                    </p>
                  )}

                  {/* Linked Order */}
                  {c.orderId && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[11px]">
                      <span className="text-gray-500">
                        সংযুক্ত অর্ডার: <strong className="text-gray-900 font-sans font-bold">#{c.orderId}</strong>
                        {linkedOrder && (
                          <span className="ml-1 text-emerald-700 font-sans font-bold">
                            (৳{linkedOrder.totalAmount})
                          </span>
                        )}
                      </span>
                      {linkedOrder && onViewOrderDetails && (
                        <button
                          type="button"
                          onClick={() => onViewOrderDetails(linkedOrder)}
                          className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>অর্ডার দেখুন</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Complaint Problem Description */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    অভিযোগের বিবরণ / সমস্যা:
                  </span>
                  <div className="bg-orange-50/30 p-3 rounded-xl border border-orange-100/60 text-xs text-gray-800 leading-relaxed font-medium">
                    {c.description}
                  </div>
                </div>

                {/* Call History Mini Bar ("কাস্টমারের সাথে কয়বার কথা হয়েছে কোন প্রতিনিধি কথা বলেছে") */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-orange-600" />
                      <span>কথোপকথন ও কল হিস্ট্রি</span>
                    </span>
                    <span className="font-bold text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-full text-[11px]">
                      {callCount > 0 ? `মোট ${toBn(callCount)} বার কথা হয়েছে` : 'কোনো কল হয়নি'}
                    </span>
                  </div>

                  {callCount > 0 ? (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {c.callLogs.map((log) => (
                        <div key={log.id} className="text-[11px] bg-white p-2 rounded-lg border border-gray-100 space-y-1">
                          <div className="flex items-center justify-between text-gray-500">
                            <span className="font-extrabold text-gray-800">
                              {toBn(log.callNumber)}ম কল - <strong className="text-orange-600">{log.representativeName}</strong>
                            </span>
                            <span className="text-[10px] text-gray-400">{log.callDate}</span>
                          </div>
                          <p className="text-gray-700 font-medium leading-tight">
                            {log.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">
                      এখনো কোনো কল রেকর্ড যুক্ত করা হয়নি।
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComplaint(c);
                      setShowLogCallModal(true);
                    }}
                    className="w-full bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 hover:border-orange-300 font-extrabold text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ কল রেকর্ড ও আলোচনা যুক্ত করুন</span>
                  </button>
                </div>

                {/* Resolution Block (if resolved) */}
                {c.resolution && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>সমাধান বিবরণী:</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {c.resolution.resolvedAt}
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium">
                      <strong className="text-emerald-700">{c.resolution.actionTakenLabel}:</strong> {c.resolution.resolutionNotes}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-emerald-100">
                      <span>সমাধানকারী: <strong className="text-gray-800">{c.resolution.resolvedBy}</strong></span>
                      {c.resolution.refundAmount !== undefined && (
                        <span>রিফান্ড: <strong className="text-red-600 font-sans">৳{c.resolution.refundAmount}</strong></span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    {c.status !== 'resolved' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedComplaint(c);
                          setShowResolveModal(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>সমাধান সম্পন্ন করুন</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(c, 'in_progress')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-[11px]"
                      >
                        পুনরায় তদন্তে নিন
                      </button>
                    )}

                    {c.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(c, 'in_progress')}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-[11px]"
                      >
                        তদন্ত শুরু
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedComplaint(c)}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                      title="বিস্তারিত ও হিস্ট্রি"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`আপনি কি নিশ্চিত যে #${c.id} কম্পেলেইনটি মুছে ফেলতে চান?`)) {
                          await onDeleteComplaint(c.id);
                          notify('কম্পেলেইন মুছে ফেলা হয়েছে', 'info');
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="ডিলিট করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL: Create New Complaint */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-600" />
                <span>নতুন গ্রাহক অভিযোগ / কম্পেলেইন এন্ট্রি</span>
              </h3>
              <p className="text-xs text-gray-400">
                গ্রাহকের মোবাইল নম্বর দিয়ে সার্চ করুন বা তথ্য দিয়ে অভিযোগ সিস্টেমে জমা দিন।
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Phone & Lookup */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  গ্রাহকের মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={newCustPhone}
                    onChange={(e) => handlePhoneLookup(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl font-bold font-sans text-sm focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  নম্বর লিখলে পূর্বের অর্ডারের নাম ও ঠিকানা স্বয়ংক্রিয়ভাবে পাওয়া যাবে।
                </p>
                {matchedPhoneOrders.length > 0 && (
                  <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-amber-900 font-extrabold">
                      <span>সিস্টেমে এই নম্বরে {toBn(matchedPhoneOrders.length)}টি অর্ডার পাওয়া গেছে:</span>
                      <span className="text-[10px] text-amber-700">ক্লিক করে সিলেক্ট করুন</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                      {matchedPhoneOrders.map((ord) => {
                        const isSelected = newOrderId === ord.id;
                        return (
                          <button
                            key={ord.id}
                            type="button"
                            onClick={() => handleSelectCustomerOrder(ord)}
                            className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-600 font-black shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <span className="font-mono font-bold">#{ord.id}</span>
                            <span className="text-[10px] opacity-80">(৳{ord.totalAmount})</span>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Name & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">গ্রাহকের নাম</label>
                  <input
                    type="text"
                    placeholder="নাম লিখুন"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-semibold focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">অর্ডার আইডি (যদি থাকে)</label>
                  <input
                    type="text"
                    placeholder="e.g. ML-102934"
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono font-bold focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">গ্রাহকের ঠিকানা</label>
                <input
                  type="text"
                  placeholder="ঠিকানা ও জেলা"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl font-semibold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Issue Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">সমস্যার ক্যাটাগরি</label>
                  <select
                    value={newIssueCategory}
                    onChange={(e) => setNewIssueCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold bg-white focus:outline-hidden focus:border-orange-500 cursor-pointer"
                  >
                    {ISSUE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">অগ্রাধিকার (Priority)</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold bg-white focus:outline-hidden focus:border-orange-500 cursor-pointer"
                  >
                    <option value="normal">সাধারণ (Normal)</option>
                    <option value="high">জরুরি (High)</option>
                    <option value="urgent">অতি জরুরি (Urgent)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  অভিযোগের বিস্তারিত বিবরণ ও কি সমস্যা হয়েছে <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="গ্রাহকের সাথে কী কথা হয়েছে, কি সমস্যা ঘটেছে (যেমন: বোতল ভেঙে গেছে, পণ্য কম পাওয়া গেছে ইত্যাদি)..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:outline-hidden focus:border-orange-500 leading-relaxed"
                />
              </div>

              {/* Logging Agent Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">যে প্রতিনিধি এন্ট্রি করছেন</label>
                <input
                  type="text"
                  value={newRepresentative}
                  onChange={(e) => setNewRepresentative(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold text-gray-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'জমা হচ্ছে...' : 'কম্পেলেইন জমা দিন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Log Call with Customer */}
      {showLogCallModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowLogCallModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <PhoneCall className="w-4.5 h-4.5 text-orange-600" />
                <span>গ্রাহকের সাথে কথা বলার রেকর্ড (কল নং: {toBn((selectedComplaint.callLogs?.length || 0) + 1)})</span>
              </h3>
              <p className="text-xs text-gray-400">
                গ্রাহক: {selectedComplaint.customerName} ({selectedComplaint.customerPhone})
              </p>
            </div>

            <form onSubmit={handleSaveCallLog} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">কোন প্রতিনিধি কথা বলেছেন?</label>
                <input
                  type="text"
                  required
                  value={callLogRepresentative}
                  onChange={(e) => setCallLogRepresentative(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  আলোচনার সারসংক্ষেপ ও কাস্টমারের বক্তব্য <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="গ্রাহকের সাথে কি কথা হলো, কি সিদ্ধান্ত হলো..."
                  value={callLogNotes}
                  onChange={(e) => setCallLogNotes(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">গ্রাহকের প্রতিক্রিয়া / মনোভাব</label>
                <select
                  value={callLogResponse}
                  onChange={(e) => setCallLogResponse(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold bg-white focus:outline-hidden cursor-pointer"
                >
                  <option value="satisfied">সন্তুষ্ট ও আশ্বস্ত (Satisfied)</option>
                  <option value="neutral">স্বাভাবিক / নিরপেক্ষ (Neutral)</option>
                  <option value="followup_needed">পুনরায় যোগাযোগের প্রয়োজন (Follow-up needed)</option>
                  <option value="unhappy">ক্ষুব্ধ / অসন্তুষ্ট (Unhappy)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowLogCallModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  কল রেকর্ড সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Resolve Complaint */}
      {showResolveModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowResolveModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>অভিযোগ সমাধান ও ক্লোজিং ফরম</span>
              </h3>
              <p className="text-xs text-gray-400">
                গ্রাহক: {selectedComplaint.customerName} | সমস্যা: {selectedComplaint.issueCategoryLabel}
              </p>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">কী পদক্ষেপ গ্রহণ করা হলো?</label>
                <select
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold bg-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  {ACTION_OPTIONS.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>

              {(resolveAction === 'refund' || resolveAction === 'partial_refund') && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">রিফান্ডের টাকার পরিমাণ (৳)</label>
                  <input
                    type="number"
                    placeholder="টাকার অংক লিখুন"
                    value={resolveRefundAmount}
                    onChange={(e) => setResolveRefundAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold font-sans"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  কীভাবে সমাধান সম্পন্ন হলো তার নোট <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="গ্রাহকের সাথে কথা বলে সমাধান করা হলো (যেমন: নতুন পণ্য কুরিয়ার করা হয়েছে / টাকা ফেরত দেওয়া হয়েছে ইত্যাদি)..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:outline-hidden focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">সমাধানকারী প্রতিনিধি</label>
                  <input
                    type="text"
                    required
                    value={resolveRepresentative}
                    onChange={(e) => setResolveRepresentative(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">গ্রাহকের চূড়ান্ত সন্তুষ্টি</label>
                  <select
                    value={resolveIsSatisfied ? 'yes' : 'no'}
                    onChange={(e) => setResolveIsSatisfied(e.target.value === 'yes')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="yes">✓ গ্রাহক সন্তুষ্ট হয়েছেন</option>
                    <option value="no">✕ গ্রাহক এখনো পুরোপুরি সন্তুষ্ট নন</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  সমাধান নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsTab;
