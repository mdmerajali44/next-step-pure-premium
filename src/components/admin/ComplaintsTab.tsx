import React, { useState, useMemo, useEffect } from 'react';
import { Complaint, Order, User, matchesSearchWithNumerals } from '../../types';
import {
  AlertTriangle, Phone, PhoneCall, CheckCircle2, Clock, UserCheck,
  Search, Plus, X, MessageSquare, ShieldAlert, ArrowRight,
  Download, Eye, Edit3, Trash2, Check, FileText, Mail, XCircle,
  RefreshCw, ArrowUp, ArrowDown, Minus, User as UserIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

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
  externalStatusFilter?: 'all' | 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  onStatusFilterChange?: (val: 'all' | 'pending' | 'in_progress' | 'resolved') => void;
  openCreateTrigger?: number;
  subView?: 'list' | 'create';
  onSubViewChange?: (val: 'list' | 'create') => void;
  allowedStatuses?: ('all' | 'pending' | 'in_progress' | 'resolved')[];
  canCreate?: boolean;
  canDelete?: boolean;
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
  prefillOrderId,
  externalStatusFilter,
  onStatusFilterChange,
  openCreateTrigger,
  subView = 'list',
  onSubViewChange,
  allowedStatuses,
  canCreate = true,
  canDelete = true,
}) => {
  const effectiveAllowedStatuses = useMemo(
    () =>
      allowedStatuses && allowedStatuses.length > 0
        ? allowedStatuses
        : (['all', 'pending', 'in_progress', 'resolved'] as const),
    [allowedStatuses]
  );

  const canViewAll = effectiveAllowedStatuses.includes('all');
  const canViewStatus = (st: 'all' | 'pending' | 'in_progress' | 'resolved' | 'cancelled') => {
    if (canViewAll) return true;
    if (st === 'cancelled') return effectiveAllowedStatuses.includes('all');
    return effectiveAllowedStatuses.includes(st as any);
  };

  const [searchQuery, setSearchQuery] = useState(prefillPhone || '');
  const [statusFilter, setStatusFilterState] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'cancelled'>(() => {
    const initial = externalStatusFilter || 'all';
    if (!allowedStatuses || allowedStatuses.length === 0) return initial;
    if (allowedStatuses.includes(initial as any)) return initial;
    return allowedStatuses[0];
  });
  const [urgentOnlyFilter, setUrgentOnlyFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(null);

  const setStatusFilter = (val: 'all' | 'pending' | 'in_progress' | 'resolved' | 'cancelled') => {
    if (!canViewStatus(val)) return;
    setUrgentOnlyFilter(false);
    setStatusFilterState(val);
    setCurrentPage(1);
    if (val === 'all' || val === 'pending' || val === 'in_progress' || val === 'resolved') {
      onStatusFilterChange?.(val);
    }
  };

  useEffect(() => {
    if (externalStatusFilter && canViewStatus(externalStatusFilter)) {
      setStatusFilterState(externalStatusFilter);
      setUrgentOnlyFilter(false);
      setCurrentPage(1);
    }
  }, [externalStatusFilter]);

  useEffect(() => {
    if (!canViewStatus(statusFilter)) {
      setStatusFilterState(effectiveAllowedStatuses[0] || 'all');
    }
  }, [effectiveAllowedStatuses]);

  // Quick Create Modal (when clicking "+ নতুন অভিযোগ যোগ করুন" inside main workspace)
  const [showCreateModal, setShowCreateModal] = useState(false);
  useEffect(() => {
    if (openCreateTrigger && openCreateTrigger > 0 && canCreate) {
      setShowCreateModal(true);
    }
  }, [openCreateTrigger, canCreate]);

  // Selected Complaint for Floating Split-Pane Detail Panel
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailDismissed, setIsDetailDismissed] = useState(false);

  // Active inline action mode inside the Floating Detail Panel: 'assign' | 'reply' | 'status' | 'resolve' | null
  const [activeActionMode, setActiveActionMode] = useState<'assign' | 'reply' | 'status' | 'resolve' | null>(null);

  // Inline Assign state
  const [assignName, setAssignName] = useState(loggedInUser?.name || 'কাস্টমার সাপোর্ট');
  const [assignPriority, setAssignPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

  // Inline Reply / Call Log state
  const [callLogRepresentative, setCallLogRepresentative] = useState(loggedInUser?.name || 'কাস্টমার সাপোর্ট');
  const [callLogNotes, setCallLogNotes] = useState('');
  const [callLogResponse, setCallLogResponse] = useState<'satisfied' | 'neutral' | 'unhappy' | 'followup_needed'>('satisfied');

  // Inline Resolution state
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

  // Convert English number to Bengali number
  const toBn = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '০';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, d => bnDigits[parseInt(d, 10)]);
  };

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

  // Stats calculation across ALL complaints (always visible in top 6 KPI cards)
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const cancelled = complaints.filter(c => c.status === 'cancelled').length;
    const urgent = complaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length;
    return { total, pending, inProgress, resolved, cancelled, urgent };
  }, [complaints]);

  // Filtered list
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      if (!canViewAll && !effectiveAllowedStatuses.includes(c.status as any)) return false;
      if (urgentOnlyFilter && c.priority !== 'urgent' && c.priority !== 'high') return false;
      if (!urgentOnlyFilter && statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.issueCategory !== categoryFilter) return false;
      if (dateFilter) {
        const formattedSelected = new Date(dateFilter).toLocaleDateString('bn-BD');
        const created = c.createdAt || '';
        if (!created.includes(dateFilter) && !created.includes(formattedSelected)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim();
        const matchPhone = matchesSearchWithNumerals(c.customerPhone, q);
        const matchName = matchesSearchWithNumerals(c.customerName, q);
        const matchId = matchesSearchWithNumerals(c.id, q);
        const matchOrder = c.orderId && matchesSearchWithNumerals(c.orderId, q);
        const matchDesc = matchesSearchWithNumerals(c.description, q);
        const matchCat = matchesSearchWithNumerals(c.issueCategoryLabel, q);
        if (!matchPhone && !matchName && !matchId && !matchOrder && !matchDesc && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, statusFilter, urgentOnlyFilter, categoryFilter, dateFilter, searchQuery, canViewAll, effectiveAllowedStatuses]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedComplaints = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredComplaints.slice(start, start + pageSize);
  }, [filteredComplaints, safePage, pageSize]);

  // Sync & auto-select first visible complaint so details are always right in front of the eyes
  useEffect(() => {
    if (filteredComplaints.length === 0) {
      setSelectedComplaint(null);
      return;
    }
    if (selectedComplaint) {
      const updatedInList = filteredComplaints.find(c => c.id === selectedComplaint.id);
      if (updatedInList) {
        if (updatedInList !== selectedComplaint) {
          setSelectedComplaint(updatedInList);
        }
        return;
      }
    }
    if (!isDetailDismissed) {
      setSelectedComplaint(filteredComplaints[0]);
    }
  }, [filteredComplaints, isDetailDismissed]);

  // Sync inline assign form inputs when selectedComplaint changes
  useEffect(() => {
    if (selectedComplaint) {
      setAssignName(selectedComplaint.assignedTo || selectedComplaint.createdBy || loggedInUser?.name || 'কাস্টমার সাপোর্ট');
      setAssignPriority(selectedComplaint.priority || 'normal');
    }
  }, [selectedComplaint?.id]);

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
        assignedTo: newRepresentative.trim() || 'অ্যাডমিন',
        callLogs: []
      });

      notify(`অভিযোগ #${created.id} সফলভাবে জমা হয়েছে!`, 'success');
      setShowCreateModal(false);
      setIsDetailDismissed(false);
      setSelectedComplaint(created);
      onSubViewChange?.('list');
      setNewCustPhone('');
      setNewCustName('');
      setNewCustAddress('');
      setNewOrderId('');
      setNewDescription('');
    } catch (err: any) {
      notify(err?.message || 'অভিযোগ জমা দিতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Assignment & Priority
  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      const updated: Complaint = {
        ...selectedComplaint,
        assignedTo: assignName.trim() || 'কাস্টমার সাপোর্ট',
        priority: assignPriority,
        status: selectedComplaint.status === 'pending' ? 'in_progress' : selectedComplaint.status,
        updatedAt: new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD')
      };
      const saved = await onUpdateComplaint(updated);
      setSelectedComplaint(saved);
      setActiveActionMode(null);
      notify(`দায়িত্ব প্রদান ও অগ্রাধিকার আপডেট হয়েছে!`, 'success');
    } catch {
      notify('দায়িত্ব প্রদান সংরক্ষণে ব্যর্থ হয়েছে', 'error');
    }
  };

  // Submit Call Log / Reply
  const handleSaveCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!callLogNotes.trim()) {
      notify('আলোচনা বা উত্তরের বিবরণ লিখুন', 'error');
      return;
    }

    try {
      const updated = await onAddCallLog(selectedComplaint.id, {
        representativeName: callLogRepresentative.trim() || 'প্রতিনিধি',
        notes: callLogNotes.trim(),
        customerResponse: callLogResponse
      });

      setSelectedComplaint(updated);
      setCallLogNotes('');
      setActiveActionMode(null);
      notify('উত্তর ও কল রেকর্ড সফলভাবে যুক্ত হয়েছে!', 'success');
    } catch (err: any) {
      notify(err?.message || 'কল রেকর্ড সংরক্ষণে ব্যর্থ হয়েছে', 'error');
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
    const nowStr = new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD');

    const updatedComplaint: Complaint = {
      ...selectedComplaint,
      status: 'resolved',
      updatedAt: nowStr,
      resolution: {
        resolvedAt: nowStr,
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
      setResolveNotes('');
      setResolveRefundAmount('');
      setActiveActionMode(null);
      notify(`অভিযোগ #${saved.id} সফলভাবে সমাধান হয়েছে!`, 'success');
    } catch (err: any) {
      notify(err?.message || 'সমাধান সংরক্ষণে সমস্যা হয়েছে', 'error');
    }
  };

  // Quick Status change
  const handleQuickStatusChange = async (complaint: Complaint, newStatus: Complaint['status']) => {
    if (newStatus === 'resolved') {
      setSelectedComplaint(complaint);
      setIsDetailDismissed(false);
      setActiveActionMode('resolve');
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
      setActiveActionMode(null);
      notify(`স্ট্যাটাস পরিবর্তন সম্পন্ন হয়েছে`, 'success');
    } catch {
      notify('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে', 'error');
    }
  };

  // Download CSV Report
  const handleExportReport = () => {
    if (filteredComplaints.length === 0) {
      notify('ডাউনলোড করার মতো কোনো অভিযোগ নেই', 'info');
      return;
    }
    const headers = ['অভিযোগ নং', 'গ্রাহকের নাম', 'মোবাইল', 'অর্ডার আইডি', 'ক্যাটাগরি', 'অগ্রাধিকার', 'স্ট্যাটাস', 'দায়িত্বপ্রাপ্ত', 'তারিখ', 'বিবরণ'];
    const escapeCsv = (val: string | undefined) => `"${String(val || '').replace(/"/g, '""')}"`;
    const rows = filteredComplaints.map(c => [
      escapeCsv(c.id),
      escapeCsv(c.customerName),
      escapeCsv(c.customerPhone),
      escapeCsv(c.orderId || '-'),
      escapeCsv(c.issueCategoryLabel),
      escapeCsv(c.priority === 'urgent' ? 'অতি জরুরি' : c.priority === 'high' ? 'উচ্চ' : 'সাধারণ'),
      escapeCsv(c.status === 'resolved' ? 'সমাধান হয়েছে' : c.status === 'in_progress' ? 'চলমান' : c.status === 'cancelled' ? 'বাতিল' : 'নতুন'),
      escapeCsv(c.assignedTo || c.createdBy),
      escapeCsv(c.createdAt),
      escapeCsv(c.description)
    ].join(','));
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `complaints-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('অভিযোগ রিপোর্ট ডাউনলোড সম্পন্ন হয়েছে!', 'success');
  };

  const renderStatusPill = (status: Complaint['status']) => {
    if (status === 'resolved') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">সমাধান হয়েছে</span>;
    }
    if (status === 'in_progress') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800">চলমান</span>;
    }
    if (status === 'cancelled') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-700">বাতিল</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-100 text-sky-800">নতুন</span>;
  };

  const renderPriorityBadge = (priority: Complaint['priority']) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-red-600">
          <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
          <span>অতি জরুরি</span>
        </span>
      );
    }
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-orange-600">
          <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>উচ্চ</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
        <ArrowDown className="w-3.5 h-3.5" />
        <span>সাধারণ</span>
      </span>
    );
  };

  // Dedicated Create View (when navigated directly via Sidebar -> "নতুন অভিযোগ নথিভুক্ত")
  if (subView === 'create' && canCreate) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-xs space-y-5 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-700" />
              <span>নতুন গ্রাহক অভিযোগ নথিভুক্ত করুন</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              গ্রাহকের মোবাইল নম্বর দিয়ে সার্চ করুন বা তথ্য দিয়ে অভিযোগ সিস্টেমে জমা দিন।
            </p>
          </div>
          {onSubViewChange && (
            <button
              type="button"
              onClick={() => onSubViewChange('list')}
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer self-start sm:self-auto"
            >
              ← অভিযোগ ব্যবস্থাপনায় ফিরুন
            </button>
          )}
        </div>

        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
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
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl font-bold font-sans text-sm focus:outline-hidden focus:border-teal-600"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              নম্বর লিখলে পূর্বের অর্ডারের নাম ও ঠিকানা স্বয়ংক্রিয়ভাবে পাওয়া যাবে।
            </p>
            {matchedPhoneOrders.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-amber-900 font-extrabold">
                  <span>এই নম্বরে {toBn(matchedPhoneOrders.length)}টি অর্ডার পাওয়া গেছে:</span>
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
                            ? 'bg-teal-700 text-white border-teal-700 font-black shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400'
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">গ্রাহকের নাম</label>
              <input
                type="text"
                placeholder="নাম লিখুন"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl font-semibold focus:outline-hidden focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">অর্ডার আইডি (যদি থাকে)</label>
              <input
                type="text"
                placeholder="e.g. ML-102934"
                value={newOrderId}
                onChange={(e) => setNewOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono font-bold focus:outline-hidden focus:border-teal-600"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-xl font-semibold focus:outline-hidden focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">সমস্যার ক্যাটাগরি</label>
              <select
                value={newIssueCategory}
                onChange={(e) => setNewIssueCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold bg-white focus:outline-hidden focus:border-teal-600 cursor-pointer"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold bg-white focus:outline-hidden focus:border-teal-600 cursor-pointer"
              >
                <option value="normal">সাধারণ (Normal)</option>
                <option value="high">উচ্চ (High)</option>
                <option value="urgent">অতি জরুরি (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              অভিযোগের বিস্তারিত বিবরণ <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="গ্রাহকের সাথে কী কথা হয়েছে, কি সমস্যা ঘটেছে বিস্তারিত লিখুন..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600 leading-relaxed"
            />
          </div>

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
            {onSubViewChange && (
              <button
                type="button"
                onClick={() => onSubViewChange('list')}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
              >
                বাতিল
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'জমা হচ্ছে...' : 'অভিযোগ জমা দিন'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Top Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">অভিযোগ ব্যবস্থাপনা</h2>
            <p className="text-xs text-gray-500 font-medium">ব্যবহারকারীদের অভিযোগ গ্রহণ, যাচাই, সমাধান ও মনিটরিং</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportReport}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-extrabold flex items-center gap-2 transition-all shadow-3xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span>রিপোর্ট ডাউনলোড</span>
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setNewCustPhone(searchQuery);
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>নতুন অভিযোগ যোগ করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Floating Glanceable KPI Cards (Clickable Quick Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {canViewStatus('all') && (
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center gap-3 bg-sky-50/70 hover:shadow-sm ${
              !urgentOnlyFilter && statusFilter === 'all' ? 'border-sky-400 ring-2 ring-sky-200 shadow-xs' : 'border-sky-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-gray-600 truncate">মোট অভিযোগ</span>
              <span className="block text-xl font-black text-gray-900 font-sans">{toBn(stats.total)}</span>
            </div>
          </button>
        )}

        {canViewStatus('pending') && (
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center gap-3 bg-amber-50/70 hover:shadow-sm ${
              !urgentOnlyFilter && statusFilter === 'pending' ? 'border-amber-400 ring-2 ring-amber-200 shadow-xs' : 'border-amber-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-gray-600 truncate">নতুন অভিযোগ</span>
              <span className="block text-xl font-black text-gray-900 font-sans">{toBn(stats.pending)}</span>
            </div>
          </button>
        )}

        {canViewStatus('in_progress') && (
          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center gap-3 bg-purple-50/70 hover:shadow-sm ${
              !urgentOnlyFilter && statusFilter === 'in_progress' ? 'border-purple-400 ring-2 ring-purple-200 shadow-xs' : 'border-purple-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-gray-600 truncate">চলমান</span>
              <span className="block text-xl font-black text-gray-900 font-sans">{toBn(stats.inProgress)}</span>
            </div>
          </button>
        )}

        {canViewStatus('resolved') && (
          <button
            type="button"
            onClick={() => setStatusFilter('resolved')}
            className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center gap-3 bg-emerald-50/70 hover:shadow-sm ${
              !urgentOnlyFilter && statusFilter === 'resolved' ? 'border-emerald-400 ring-2 ring-emerald-200 shadow-xs' : 'border-emerald-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-gray-600 truncate">সমাধান হয়েছে</span>
              <span className="block text-xl font-black text-gray-900 font-sans">{toBn(stats.resolved)}</span>
            </div>
          </button>
        )}

        {canViewAll && (
          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center gap-3 bg-rose-50/70 hover:shadow-sm ${
              !urgentOnlyFilter && statusFilter === 'cancelled' ? 'border-rose-400 ring-2 ring-rose-200 shadow-xs' : 'border-rose-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-gray-600 truncate">বাতিল</span>
              <span className="block text-xl font-black text-gray-900 font-sans">{toBn(stats.cancelled)}</span>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setUrgentOnlyFilter(!urgentOnlyFilter);
            setCurrentPage(1);
          }}
          className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex items-center gap-3 bg-red-50/80 hover:shadow-sm ${
            urgentOnlyFilter ? 'border-red-500 ring-2 ring-red-200 shadow-xs' : 'border-red-100'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-bold text-gray-600 truncate">জরুরি অভিযোগ</span>
            <span className="block text-xl font-black text-red-700 font-sans">{toBn(stats.urgent)}</span>
          </div>
        </button>
      </div>

      {/* 3. Search & Multi-Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="অভিযোগ নং / ব্যবহারকারীর নাম / মোবাইল / বিষয়..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-14 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:bg-white focus:border-teal-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 hover:text-red-600 px-1.5 py-0.5 rounded bg-gray-200 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-hidden focus:border-teal-600 cursor-pointer"
            >
              <option value="all">সব ক্যাটাগরি</option>
              {ISSUE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={urgentOnlyFilter ? 'all' : statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-hidden focus:border-teal-600 cursor-pointer"
            >
              {canViewStatus('all') && <option value="all">সব স্ট্যাটাস</option>}
              {canViewStatus('pending') && <option value="pending">নতুন (অপেক্ষমাণ)</option>}
              {canViewStatus('in_progress') && <option value="in_progress">চলমান</option>}
              {canViewStatus('resolved') && <option value="resolved">সমাধান হয়েছে</option>}
              {canViewAll && <option value="cancelled">বাতিল</option>}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-1.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-200 bg-white rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-teal-600"
              title="তারিখ নির্বাচন"
            />
            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || urgentOnlyFilter || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setDateFilter('');
                  setStatusFilter('all');
                }}
                className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shrink-0 cursor-pointer"
                title="রিসেট ফিল্টার"
              >
                রিসেট
              </button>
            )}
          </div>
        </div>

        {/* Instant customer match banner when searching phone */}
        {searchQuery.trim().length >= 4 && (() => {
          const matchedOrders = orders.filter(o => o.customerPhone && o.customerPhone.includes(searchQuery.trim()));
          if (matchedOrders.length === 0) return null;
          const first = matchedOrders[0];
          return (
            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-gray-800">
                  গ্রাহক: <strong>{first.customerName}</strong> ({first.customerPhone}) — মোট {toBn(matchedOrders.length)}টি অর্ডার
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${first.customerPhone}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>কল</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    handlePhoneLookup(first.customerPhone);
                    setShowCreateModal(true);
                  }}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>অভিযোগ তুলুন</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 4. Master-Detail Split Workspace (Table Left + Floating Sticky Detail & Resolution Card Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT PANE: Complaints Table */}
        <div className={`${selectedComplaint ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden`}>
          {filteredComplaints.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-black text-gray-800 text-base">কোনো অভিযোগ পাওয়া যায়নি</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || urgentOnlyFilter
                  ? 'আপনার সার্চ বা ফিল্টারের সাথে কোনো অভিযোগ মেলেনি।'
                  : 'এখনো কোনো অভিযোগ নথিভুক্ত নেই। "+ নতুন অভিযোগ যোগ করুন" বাটনে ক্লিক করে নতুন অভিযোগ যুক্ত করতে পারেন।'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || urgentOnlyFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setDateFilter('');
                      setStatusFilter('all');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    সকল অভিযোগ দেখুন
                  </button>
                )}
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold cursor-pointer"
                  >
                    + নতুন অভিযোগ যোগ করুন
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-black text-gray-600">
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">অভিযোগ নং</th>
                      <th className="py-3 px-3">বিষয় ও বিবরণ</th>
                      <th className="py-3 px-3">অভিযোগকারী</th>
                      <th className="py-3 px-3">ক্যাটাগরি</th>
                      <th className="py-3 px-3">অগ্রাধিকার</th>
                      <th className="py-3 px-3">স্ট্যাটাস</th>
                      <th className="py-3 px-3">তারিখ</th>
                      <th className="py-3 px-3 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedComplaints.map((c, idx) => {
                      const isSelected = selectedComplaint?.id === c.id;
                      const catObj = ISSUE_CATEGORIES.find(cat => cat.id === c.issueCategory);
                      const rowNum = (safePage - 1) * pageSize + idx + 1;

                      return (
                        <tr
                          key={c.id}
                          onClick={() => {
                            setSelectedComplaint(c);
                            setIsDetailDismissed(false);
                            setActiveActionMode(null);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/70 border-l-4 border-l-teal-600'
                              : 'hover:bg-gray-50/80'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-gray-500">{toBn(rowNum)}</td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">#{c.id}</td>
                          <td className="py-3 px-3 max-w-[180px]">
                            <p className="font-bold text-gray-900 truncate" title={c.description}>
                              {c.description}
                            </p>
                            {c.orderId && (
                              <span className="text-[10px] text-teal-700 font-bold">অর্ডার #{c.orderId}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <UserIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <div>
                                <p className="font-bold text-gray-900 leading-tight">{c.customerName}</p>
                                <p className="text-[10px] text-gray-500 font-sans">{c.customerPhone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${catObj ? catObj.color : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                              {c.issueCategoryLabel || catObj?.label || 'অন্যান্য'}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">{renderPriorityBadge(c.priority)}</td>
                          <td className="py-3 px-3 whitespace-nowrap">{renderStatusPill(c.status)}</td>
                          <td className="py-3 px-3 text-[11px] text-gray-500 whitespace-nowrap">{c.createdAt}</td>
                          <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedComplaint(c);
                                  setIsDetailDismissed(false);
                                  setActiveActionMode(null);
                                }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                                title="বিস্তারিত দেখুন"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedComplaint(c);
                                  setIsDetailDismissed(false);
                                  setActiveActionMode('reply');
                                }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="উত্তর / কল লগ দিন"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => setComplaintToDelete(c)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="px-4 py-3 border-t border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">প্রতি পৃষ্ঠায়:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-200 bg-white rounded-lg px-2 py-1 font-bold text-gray-700 cursor-pointer"
                    >
                      <option value={10}>{toBn(10)}</option>
                      <option value={20}>{toBn(20)}</option>
                      <option value={50}>{toBn(50)}</option>
                    </select>
                  </div>
                  <span className="font-bold">মোট: {toBn(filteredComplaints.length)}টি অভিযোগ</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), safePage + 2).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold cursor-pointer ${
                        safePage === page
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {toBn(page)}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANE: Floating Sticky Detail & Resolution Panel ("সব চোখের সামনে দেখা ও সমাধান করা যাবে") */}
        {selectedComplaint && (() => {
          const c = selectedComplaint;
          const catObj = ISSUE_CATEGORIES.find(cat => cat.id === c.issueCategory);
          const linkedOrder = c.orderId ? orders.find(o => o.id === c.orderId) : null;
          const callCount = c.callLogs?.length || 0;

          return (
            <div className="lg:col-span-5 lg:sticky lg:top-20 bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              {/* Detail Header */}
              <div className="px-5 py-3.5 border-b border-gray-100 bg-slate-50/70 flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-sm md:text-base flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-teal-700" />
                  <span>অভিযোগের বিস্তারিত</span>
                </h3>
                <div className="flex items-center gap-1">
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setComplaintToDelete(c)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="অভিযোগ ডিলিট করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComplaint(null);
                      setIsDetailDismissed(true);
                      setActiveActionMode(null);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 cursor-pointer"
                    title="বন্ধ করুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4 text-xs max-h-[calc(100vh-14rem)] overflow-y-auto">
                {/* Structured Key-Value Metadata */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-gray-500 font-bold">অভিযোগ নং</span>
                    <span className="col-span-8 font-mono font-black text-gray-900">: #{c.id}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-gray-500 font-bold">বিষয় / ধরন</span>
                    <span className="col-span-8 font-extrabold text-gray-900">: {c.issueCategoryLabel || catObj?.label || 'অভিযোগ'}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-gray-500 font-bold">অভিযোগকারী</span>
                    <span className="col-span-8 font-bold text-gray-900 flex items-center gap-1.5">
                      <span>:</span>
                      <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{c.customerName}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-gray-500 font-bold">মোবাইল</span>
                    <div className="col-span-8 flex items-center justify-between gap-2">
                      <span className="font-bold font-sans text-gray-900">: {c.customerPhone}</span>
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${c.customerPhone}`}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-colors"
                          title="সরাসরি কল করুন"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/88${c.customerPhone.replace(/^(\+88|0)/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white rounded-lg transition-colors"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                  {c.customerAddress && (
                    <div className="grid grid-cols-12 gap-2 items-start">
                      <span className="col-span-4 text-gray-500 font-bold">ঠিকানা</span>
                      <span className="col-span-8 text-gray-700 font-medium">: {c.customerAddress}</span>
                    </div>
                  )}
                  {c.orderId && (
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-4 text-gray-500 font-bold">অর্ডার আইডি</span>
                      <div className="col-span-8 flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-gray-900">
                          : #{c.orderId} {linkedOrder ? `(৳${linkedOrder.totalAmount})` : ''}
                        </span>
                        {linkedOrder && onViewOrderDetails && (
                          <button
                            type="button"
                            onClick={() => onViewOrderDetails(linkedOrder)}
                            className="text-teal-700 hover:underline font-extrabold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>অর্ডার দেখুন</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-gray-500 font-bold">ক্যাটাগরি</span>
                    <div className="col-span-8">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${catObj ? catObj.color : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {c.issueCategoryLabel || catObj?.label || 'অন্যান্য'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-gray-500 font-bold">অগ্রাধিকার</span>
                    <div className="col-span-8">: {renderPriorityBadge(c.priority)}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-gray-500 font-bold">স্ট্যাটাস</span>
                    <div className="col-span-8">: {renderStatusPill(c.status)}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-gray-500 font-bold">দায়িত্বপ্রাপ্ত</span>
                    <span className="col-span-8 font-bold text-teal-800">: {c.assignedTo || c.createdBy || 'অ্যাডমিন'}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-4 text-gray-500 font-bold">তারিখ</span>
                    <span className="col-span-8 text-gray-600 font-medium">: {c.createdAt}</span>
                  </div>
                </div>

                {/* বিবরণ Box */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <span className="font-black text-gray-800 block">বিবরণ :</span>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-gray-800 leading-relaxed font-medium">
                    {c.description}
                  </div>
                </div>

                {/* কথোপকথন ও কল হিস্ট্রি */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-gray-800 flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
                      <span>উত্তর ও কল হিস্ট্রি</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {callCount > 0 ? `মোট ${toBn(callCount)}টি আপডেট` : 'কোনো কল/উত্তর নেই'}
                    </span>
                  </div>

                  {callCount > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {c.callLogs.map((log) => (
                        <div key={log.id} className="bg-slate-50 border border-gray-100 rounded-xl p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-gray-800">
                              {toBn(log.callNumber)}নং — <span className="text-teal-700">{log.representativeName}</span>
                            </span>
                            <span className="text-[10px] text-gray-400">{log.callDate}</span>
                          </div>
                          <p className="text-gray-700 font-medium leading-snug">{log.notes}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* সমাধান বিবরণী (if resolved) */}
                {c.resolution && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>সমাধান বিবরণী</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700">{c.resolution.resolvedAt}</span>
                    </div>
                    <p className="text-gray-800 font-medium">
                      <strong className="text-emerald-800">{c.resolution.actionTakenLabel}:</strong> {c.resolution.resolutionNotes}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 border-t border-emerald-200/60">
                      <span>সমাধানকারী: <strong>{c.resolution.resolvedBy}</strong></span>
                      {c.resolution.refundAmount !== undefined && (
                        <span>রিফান্ড: <strong className="text-red-600">৳{c.resolution.refundAmount}</strong></span>
                      )}
                    </div>
                  </div>
                )}

                {/* INLINE INTERACTIVE ACTION FORMS RIGHT INSIDE THE DETAIL PANEL */}
                {activeActionMode === 'assign' && (
                  <form onSubmit={handleSaveAssign} className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-teal-900">দায়িত্ব প্রদান ও অগ্রাধিকার নির্ধারণ</span>
                      <button type="button" onClick={() => setActiveActionMode(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">প্রতিনিধির নাম</label>
                        <input
                          type="text"
                          required
                          value={assignName}
                          onChange={(e) => setAssignName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">অগ্রাধিকার</label>
                        <select
                          value={assignPriority}
                          onChange={(e) => setAssignPriority(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white font-bold cursor-pointer"
                        >
                          <option value="normal">সাধারণ</option>
                          <option value="high">উচ্চ</option>
                          <option value="urgent">অতি জরুরি</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setActiveActionMode(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-gray-600 cursor-pointer">বাতিল</button>
                      <button type="submit" className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-extrabold cursor-pointer">সংরক্ষণ করুন</button>
                    </div>
                  </form>
                )}

                {activeActionMode === 'reply' && (
                  <form onSubmit={handleSaveCallLog} className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-blue-900">গ্রাহককে উত্তর / কল রেকর্ড যুক্ত করুন</span>
                      <button type="button" onClick={() => setActiveActionMode(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">প্রতিনিধি</label>
                        <input
                          type="text"
                          required
                          value={callLogRepresentative}
                          onChange={(e) => setCallLogRepresentative(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">গ্রাহকের প্রতিক্রিয়া</label>
                        <select
                          value={callLogResponse}
                          onChange={(e) => setCallLogResponse(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white font-bold cursor-pointer"
                        >
                          <option value="satisfied">সন্তুষ্ট (Satisfied)</option>
                          <option value="neutral">স্বাভাবিক (Neutral)</option>
                          <option value="followup_needed">ফলো-আপ প্রয়োজন</option>
                          <option value="unhappy">অসন্তুষ্ট (Unhappy)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">আলোচনা / উত্তর *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="গ্রাহকের সাথে কি কথা হলো বা কী উত্তর দেওয়া হলো..."
                        value={callLogNotes}
                        onChange={(e) => setCallLogNotes(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-blue-200 bg-white font-medium"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setActiveActionMode(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-gray-600 cursor-pointer">বাতিল</button>
                      <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer">উত্তর সংরক্ষণ করুন</button>
                    </div>
                  </form>
                )}

                {activeActionMode === 'status' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-900">স্ট্যাটাস পরিবর্তন করুন</span>
                      <button type="button" onClick={() => setActiveActionMode(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => handleQuickStatusChange(c, 'pending')} className="py-2 px-3 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 font-extrabold cursor-pointer">নতুন (অপেক্ষমাণ)</button>
                      <button type="button" onClick={() => handleQuickStatusChange(c, 'in_progress')} className="py-2 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold cursor-pointer">চলমান</button>
                      <button type="button" onClick={() => handleQuickStatusChange(c, 'resolved')} className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer">সমাধান হয়েছে</button>
                      <button type="button" onClick={() => handleQuickStatusChange(c, 'cancelled')} className="py-2 px-3 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold cursor-pointer">বাতিল</button>
                    </div>
                  </div>
                )}

                {activeActionMode === 'resolve' && (
                  <form onSubmit={handleSaveResolution} className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-red-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>অভিযোগ সমাধান ও ক্লোজিং</span>
                      </span>
                      <button type="button" onClick={() => setActiveActionMode(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">কী পদক্ষেপ নেওয়া হলো?</label>
                      <select
                        value={resolveAction}
                        onChange={(e) => setResolveAction(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold cursor-pointer"
                      >
                        {ACTION_OPTIONS.map(a => (
                          <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                    {(resolveAction === 'refund' || resolveAction === 'partial_refund') && (
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">রিফান্ড পরিমাণ (৳)</label>
                        <input
                          type="number"
                          placeholder="টাকার পরিমাণ"
                          value={resolveRefundAmount}
                          onChange={(e) => setResolveRefundAmount(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">সমাধানের নোট *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="কীভাবে সমাধান করা হলো লিখুন..."
                        value={resolveNotes}
                        onChange={(e) => setResolveNotes(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200 bg-white font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">সমাধানকারী</label>
                        <input
                          type="text"
                          required
                          value={resolveRepresentative}
                          onChange={(e) => setResolveRepresentative(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">গ্রাহকের সন্তুষ্টি</label>
                        <select
                          value={resolveIsSatisfied ? 'yes' : 'no'}
                          onChange={(e) => setResolveIsSatisfied(e.target.value === 'yes')}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-bold cursor-pointer"
                        >
                          <option value="yes">✓ সন্তুষ্ট</option>
                          <option value="no">✕ অসন্তুষ্ট</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setActiveActionMode(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-gray-600 cursor-pointer">বাতিল</button>
                      <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer">সমাধান নিশ্চিত করুন</button>
                    </div>
                  </form>
                )}
              </div>

              {/* 4-Button Bottom Action Dock (Always Visible) */}
              <div className="p-3.5 border-t border-gray-100 bg-slate-50/70 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveActionMode(activeActionMode === 'assign' ? null : 'assign')}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-[11px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>দায়িত্ব প্রদান</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveActionMode(activeActionMode === 'reply' ? null : 'reply')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>উত্তর দিন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveActionMode(activeActionMode === 'status' ? null : 'status')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>স্ট্যাটাস পরিবর্তন</span>
                </button>
                {c.status !== 'resolved' ? (
                  <button
                    type="button"
                    onClick={() => setActiveActionMode(activeActionMode === 'resolve' ? null : 'resolve')}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>সমাধান করুন</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQuickStatusChange(c, 'in_progress')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>পুনরায় খুলুন</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 5. Quick Add Complaint Modal */}
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
                <ShieldAlert className="w-5 h-5 text-teal-700" />
                <span>নতুন অভিযোগ যোগ করুন</span>
              </h3>
              <p className="text-xs text-gray-400">
                গ্রাহকের মোবাইল নম্বর দিয়ে সার্চ করুন বা তথ্য দিয়ে অভিযোগ সিস্টেমে জমা দিন।
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
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
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl font-bold font-sans text-sm focus:outline-hidden focus:border-teal-600"
                  />
                </div>
                {matchedPhoneOrders.length > 0 && (
                  <div className="mt-2 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                    <span className="text-[11px] text-amber-900 font-extrabold block">
                      সিস্টেমে {toBn(matchedPhoneOrders.length)}টি অর্ডার পাওয়া গেছে (সিলেক্ট করুন):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {matchedPhoneOrders.map((ord) => {
                        const isSelected = newOrderId === ord.id;
                        return (
                          <button
                            key={ord.id}
                            type="button"
                            onClick={() => handleSelectCustomerOrder(ord)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer flex items-center gap-1 ${
                              isSelected ? 'bg-teal-700 text-white border-teal-700 font-black' : 'bg-white text-gray-700 border-gray-200'
                            }`}
                          >
                            <span className="font-mono font-bold">#{ord.id}</span>
                            <span>(৳{ord.totalAmount})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">গ্রাহকের নাম</label>
                  <input
                    type="text"
                    placeholder="নাম লিখুন"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-semibold focus:outline-hidden focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">অর্ডার আইডি (যদি থাকে)</label>
                  <input
                    type="text"
                    placeholder="e.g. ML-102934"
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono font-bold focus:outline-hidden focus:border-teal-600"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl font-semibold focus:outline-hidden focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">সমস্যার ক্যাটাগরি</label>
                  <select
                    value={newIssueCategory}
                    onChange={(e) => setNewIssueCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold bg-white focus:outline-hidden cursor-pointer"
                  >
                    {ISSUE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">অগ্রাধিকার</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-bold bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="normal">সাধারণ</option>
                    <option value="high">উচ্চ</option>
                    <option value="urgent">অতি জরুরি</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  অভিযোগের বিস্তারিত বিবরণ <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="কি সমস্যা ঘটেছে বিস্তারিত লিখুন..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:outline-hidden focus:border-teal-600"
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
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'জমা হচ্ছে...' : 'অভিযোগ জমা দিন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(complaintToDelete)}
        title="অভিযোগ ডিলিট করুন?"
        description={
          complaintToDelete ? (
            <>
              আপনি কি নিশ্চিতভাবে{' '}
              <strong className="text-gray-800 font-bold">
                "{complaintToDelete.customerName}" (#{complaintToDelete.id})
              </strong>
              -এর অভিযোগটি স্থায়ীভাবে মুছে ফেলতে চান?
            </>
          ) : null
        }
        onCancel={() => setComplaintToDelete(null)}
        onConfirm={async () => {
          if (!complaintToDelete) return;
          const targetId = complaintToDelete.id;
          const ok = await onDeleteComplaint(targetId);
          setComplaintToDelete(null);
          if (ok) {
            if (selectedComplaint?.id === targetId) setSelectedComplaint(null);
            notify('অভিযোগ মুছে ফেলা হয়েছে', 'info');
          } else {
            notify('অভিযোগ মুছে ফেলতে সমস্যা হয়েছে', 'error');
          }
        }}
      />
    </div>
  );
};

export default ComplaintsTab;
