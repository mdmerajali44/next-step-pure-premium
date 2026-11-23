import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Copy,
  X,
  Plus,
  Trash2,
  Download,
  TrendingUp,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Order,
  SiteConfig,
  Product,
  Expense,
  ExpenseCategory,
  matchesSearchWithNumerals,
} from '../../types';
import {
  toBn,
  formatMoney,
  parseFlexibleDate,
  calculateOrderCogs,
  EXPENSE_CATEGORY_LABELS,
  downloadCsvFile,
} from './adminUtils';

import DeleteConfirmModal from './DeleteConfirmModal';

interface PaymentsTabProps {
  orders: Order[];
  products?: Product[];
  expenses?: Expense[];
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  onUpdateOrder?: (order: Order) => void;
  onAddExpense?: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  onDeleteExpense?: (id: string) => Promise<boolean>;
  notify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  siteConfig: SiteConfig;
  loggedInUserName?: string;
  externalStatusFilter?: string;
  onStatusFilterChange?: (val: string) => void;
  allowedOptions?: string[];
}

type PaymentSubMode = 'transactions' | 'expenses' | 'reports';

export default function PaymentsTab({
  orders,
  products = [],
  expenses = [],
  onUpdateOrderStatus,
  onUpdateOrder,
  onAddExpense,
  onDeleteExpense,
  notify,
  siteConfig,
  loggedInUserName,
  externalStatusFilter,
  onStatusFilterChange,
  allowedOptions,
}: PaymentsTabProps) {
  const canOpt = (opt: string) => !allowedOptions || allowedOptions.includes(opt);
  const canTransactions =
    canOpt('all') || canOpt('pending') || canOpt('approved') || canOpt('cancelled');
  const canExpenses = canOpt('expenses');
  const canReports = canOpt('reports');

  const getDefaultStatusFilter = () => {
    if (canOpt('all')) return 'all';
    if (canOpt('pending')) return 'pending';
    if (canOpt('approved')) return 'approved';
    if (canOpt('cancelled')) return 'cancelled';
    return 'all';
  };

  const [subMode, setSubMode] = useState<PaymentSubMode>(() => {
    if (externalStatusFilter === 'expenses' && canExpenses) return 'expenses';
    if (externalStatusFilter === 'reports' && canReports) return 'reports';
    if (canTransactions) return 'transactions';
    if (canExpenses) return 'expenses';
    return 'reports';
  });
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilterState] = useState(() => {
    if (
      externalStatusFilter &&
      externalStatusFilter !== 'expenses' &&
      externalStatusFilter !== 'reports' &&
      canOpt(externalStatusFilter)
    ) {
      return externalStatusFilter;
    }
    return getDefaultStatusFilter();
  });

  const setPaymentStatusFilter = (val: string) => {
    setPaymentStatusFilterState(val);
    onStatusFilterChange?.(val);
  };

  useEffect(() => {
    if (externalStatusFilter === 'expenses' && canExpenses) {
      setSubMode('expenses');
    } else if (externalStatusFilter === 'reports' && canReports) {
      setSubMode('reports');
    } else if (externalStatusFilter !== undefined) {
      if (canTransactions) {
        setSubMode('transactions');
        setPaymentStatusFilterState(
          canOpt(externalStatusFilter) ? externalStatusFilter : getDefaultStatusFilter()
        );
      } else if (canExpenses) {
        setSubMode('expenses');
      } else if (canReports) {
        setSubMode('reports');
      }
    }
  }, [externalStatusFilter]);

  const [pendingConfirmOrderId, setPendingConfirmOrderId] = useState<string | null>(null);
  const [confirmCodeInput, setConfirmCodeInput] = useState('');
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // Expense form states
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('purchase');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [expNote, setExpNote] = useState('');
  const [expFilterCategory, setExpFilterCategory] = useState<string>('all');
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Reports month filter ('all' or 'YYYY-MM')
  const [reportMonth, setReportMonth] = useState<string>('all');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => {
      setCopiedTextId(null);
    }, 2000);
    notify('কপি করা হয়েছে!', 'success');
  };

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const filteredTransactions = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        matchesSearchWithNumerals(order.id, paymentSearch) ||
        matchesSearchWithNumerals(order.customerName, paymentSearch) ||
        matchesSearchWithNumerals(order.customerPhone, paymentSearch) ||
        (order.bkashNumber && matchesSearchWithNumerals(order.bkashNumber, paymentSearch)) ||
        (order.trxId && matchesSearchWithNumerals(order.trxId, paymentSearch));

      const matchesMethod =
        paymentMethodFilter === 'all' || order.paymentMethod === paymentMethodFilter;

      let matchesStatus = true;
      if (paymentStatusFilter === 'pending') {
        matchesStatus =
          order.status === 'pending' ||
          (order.paymentMethod !== 'cod' && !order.isPaymentVerified && order.status !== 'cancelled');
      } else if (paymentStatusFilter === 'approved') {
        matchesStatus =
          (order.status !== 'pending' && order.status !== 'cancelled') ||
          Boolean(order.isPaymentVerified);
      } else if (paymentStatusFilter === 'cancelled') {
        matchesStatus = order.status === 'cancelled';
      }
      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [orders, paymentSearch, paymentMethodFilter, paymentStatusFilter]);

  const handleVerifyDigitalPayment = (order: Order) => {
    const updated: Order = {
      ...order,
      isPaymentVerified: true,
      paymentVerifiedAt: new Date().toISOString(),
      status: order.status === 'pending' ? 'processing' : order.status,
    };
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    } else {
      onUpdateOrderStatus(order.id, updated.status);
    }
    notify(`অর্ডার #${order.id}-এর ডিজিটাল পেমেন্ট যাচাই সম্পন্ন হয়েছে।`, 'success');
  };

  // Financial & P&L Calculations
  const financialSummary = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');

    const grossSales = activeOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const collectedRevenue = deliveredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const productSales = activeOrders.reduce(
      (s, o) => s + Math.max(0, (o.totalAmount || 0) - (o.deliveryCharge || 0)),
      0
    );
    const totalCogs = activeOrders.reduce((s, o) => s + calculateOrderCogs(o, productMap), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = productSales - totalCogs - totalExpenses;

    const categoryTotals = (Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map(
      (cat) => ({
        category: cat,
        label: EXPENSE_CATEGORY_LABELS[cat],
        amount: expenses
          .filter((e) => e.category === cat)
          .reduce((s, e) => s + (e.amount || 0), 0),
      })
    );

    return {
      grossSales,
      collectedRevenue,
      productSales,
      totalCogs,
      totalExpenses,
      netProfit,
      categoryTotals,
    };
  }, [orders, expenses, productMap]);

  // Available months for report dropdown
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      const d = parseFlexibleDate(o.createdAt);
      if (d) set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    expenses.forEach((e) => {
      const d = parseFlexibleDate(e.date || e.createdAt);
      if (d) set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort().reverse();
  }, [orders, expenses]);

  const reportStats = useMemo(() => {
    const matchMonth = (dtVal: string | undefined) => {
      if (reportMonth === 'all') return true;
      const d = parseFlexibleDate(dtVal);
      if (!d) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === reportMonth;
    };

    const mOrders = orders.filter((o) => matchMonth(o.createdAt));
    const mActive = mOrders.filter((o) => o.status !== 'cancelled');
    const mDelivered = mOrders.filter((o) => o.status === 'delivered');
    const mExpenses = expenses.filter((e) => matchMonth(e.date || e.createdAt));

    const grossSales = mActive.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const deliveryCollected = mActive.reduce((s, o) => s + (o.deliveryCharge || 0), 0);
    const discountsGiven = mActive.reduce((s, o) => s + (o.discountAmount || 0), 0);
    const cogs = mActive.reduce((s, o) => s + calculateOrderCogs(o, productMap), 0);
    const expTotal = mExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const productRevenue = Math.max(0, grossSales - deliveryCollected);
    const netProfit = productRevenue - cogs - expTotal;

    const commissionRate = siteConfig.commissionPercentage ?? 10;
    const sellerItemsRevenue = mActive.reduce(
      (sum, o) =>
        sum +
        o.items
          .filter((it) => it.sellerId)
          .reduce((isum, it) => isum + it.price * it.quantity, 0),
      0
    );
    const commissionEarned = Math.round((sellerItemsRevenue * commissionRate) / 100);

    return {
      mOrders,
      mActive,
      mDelivered,
      mExpenses,
      grossSales,
      deliveryCollected,
      discountsGiven,
      cogs,
      expTotal,
      netProfit,
      commissionEarned,
    };
  }, [orders, expenses, reportMonth, productMap, siteConfig.commissionPercentage]);

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount || Number(expAmount) <= 0) {
      notify('খরচের বিবরণ এবং সঠিক টাকার পরিমাণ লিখুন!', 'error');
      return;
    }
    if (!onAddExpense) return;
    setIsSavingExpense(true);
    try {
      await onAddExpense({
        title: expTitle.trim(),
        category: expCategory,
        amount: Number(expAmount),
        date: expDate || new Date().toISOString().slice(0, 10),
        note: expNote.trim() || undefined,
        createdBy: loggedInUserName || 'অ্যাডমিন',
      });
      setExpTitle('');
      setExpAmount('');
      setExpNote('');
      notify('নতুন ব্যবসায়িক খরচ স্থায়ীভাবে সংরক্ষণ করা হয়েছে।', 'success');
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleExportTransactionsCsv = () => {
    downloadCsvFile(
      `transactions_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'অর্ডার আইডি',
        'তারিখ',
        'গ্রাহকের নাম',
        'মোবাইল',
        'জেলা',
        'পেমেন্ট মাধ্যম',
        'প্রেরক নম্বর',
        'TrxID',
        'মোট টাকা',
        'পেমেন্ট যাচাই',
        'অর্ডার স্ট্যাটাস',
      ],
      filteredTransactions.map((o) => [
        o.id,
        o.createdAt,
        o.customerName,
        o.customerPhone,
        o.district,
        o.paymentMethod.toUpperCase(),
        o.bkashNumber || '',
        o.trxId || '',
        o.totalAmount,
        o.paymentMethod === 'cod' ? 'COD' : o.isPaymentVerified ? 'যাচাইকৃত' : 'অপেক্ষমাণ',
        o.status,
      ])
    );
    notify('ট্রানজেকশন CSV ফাইল ডাউনলোড হয়েছে।', 'success');
  };

  const handleExportMonthlyOrdersCsv = () => {
    downloadCsvFile(
      `sales_report_${reportMonth}_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'অর্ডার আইডি',
        'তারিখ',
        'গ্রাহক',
        'ফোন',
        'জেলা',
        'এলাকা',
        'পণ্যসমূহ',
        'ডেলিভারি চার্জ',
        'ডিসকাউন্ট',
        'মোট বিক্রয় (৳)',
        'ক্রয়মূল্য/COGS (৳)',
        'পেমেন্ট',
        'স্ট্যাটাস',
      ],
      reportStats.mOrders.map((o) => [
        o.id,
        o.createdAt,
        o.customerName,
        o.customerPhone,
        o.district,
        o.area,
        o.items.map((it) => `${it.productName} (${it.quantity}x${it.unit})`).join('; '),
        o.deliveryCharge,
        o.discountAmount || 0,
        o.totalAmount,
        calculateOrderCogs(o, productMap),
        o.paymentMethod.toUpperCase(),
        o.status,
      ])
    );
    notify('মাসিক বিক্রয় রিপোর্ট (CSV) ডাউনলোড হয়েছে।', 'success');
  };

  const handleExportExpensesCsv = () => {
    downloadCsvFile(
      `expenses_report_${reportMonth}_${new Date().toISOString().slice(0, 10)}.csv`,
      ['আইডি', 'তারিখ', 'শিরোনাম', 'ক্যাটাগরি', 'টাকা (৳)', 'নোট', 'এন্ট্রিকারী'],
      reportStats.mExpenses.map((ex) => [
        ex.id,
        ex.date,
        ex.title,
        EXPENSE_CATEGORY_LABELS[ex.category] || ex.category,
        ex.amount,
        ex.note || '',
        ex.createdBy || '',
      ])
    );
    notify('খরচের হিসাব (CSV) ডাউনলোড হয়েছে।', 'success');
  };

  const handleExportInventoryCsv = () => {
    downloadCsvFile(
      `inventory_valuation_${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID', 'SKU', 'পণ্যের নাম', 'ক্যাটাগরি', 'ক্রয়মূল্য (৳)', 'বিক্রয়মূল্য (৳)', 'স্টক', 'একক', 'মজুদ মূল্য (৳)', 'স্ট্যাটাস'],
      products.map((p) => [
        p.id,
        p.sku || '',
        p.name,
        p.category,
        p.purchasePrice ?? '',
        p.price,
        p.stock,
        p.unit,
        (p.purchasePrice ?? p.price) * p.stock,
        p.status || 'Active',
      ])
    );
    notify('ইনভেন্টরি CSV রিপোর্ট ডাউনলোড হয়েছে।', 'success');
  };

  const isFocusedStatus = Boolean(
    externalStatusFilter &&
      externalStatusFilter !== 'all' &&
      externalStatusFilter !== 'expenses' &&
      externalStatusFilter !== 'reports'
  );

  const headerMeta =
    subMode === 'expenses'
      ? {
          title: 'ব্যয় ট্র্যাকার ও লাভ-ক্ষতি হিসাব (Expense Ledger)',
          desc: 'দৈনন্দিন পণ্য ক্রয়, প্যাকেজিং, কুরিয়ার ও বিজ্ঞাপনের খরচ লিখে প্রকৃত নিট লাভ দেখুন।',
        }
      : subMode === 'reports'
      ? {
          title: 'আর্থিক রিপোর্ট ও CSV এক্সপোর্ট',
          desc: 'মাসিক বিক্রয়, খরচ, কমিশন ও ইনভেন্টরি হিসাব এক ক্লিকে Excel-উপযোগী CSV ফাইলে ডাউনলোড করুন।',
        }
      : paymentStatusFilter === 'pending'
      ? {
          title: 'যাচাইয়ের অপেক্ষায় পেমেন্ট (Pending)',
          desc: 'ভেরিফিকেশনের অপেক্ষায় থাকা পেমেন্ট ট্রানজেকশনসমূহ।',
        }
      : paymentStatusFilter === 'approved'
      ? {
          title: 'অনুমোদিত পেমেন্ট তালিকা',
          desc: 'সফলভাবে যাচাইকৃত ও অনুমোদিত পেমেন্টসমূহ।',
        }
      : paymentStatusFilter === 'cancelled'
      ? {
          title: 'বাতিলকৃত ট্রানজেকশন তালিকা',
          desc: 'বাতিল হওয়া অর্ডার ও পেমেন্ট ট্রানজেকশনের বিবরণ।',
        }
      : {
          title: 'পেমেন্ট, খরচ ও আর্থিক হিসাব',
          desc: 'গ্রাহকের বিকাশ/নগদ ট্রানজেকশন যাচাই, ব্যবসায়িক ব্যয় ও মাসিক রিপোর্ট কেন্দ্র।',
        };

  return (
    <div className="space-y-6">
      {/* Header + Sub-mode Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            {subMode === 'expenses' ? (
              <Receipt className="w-5 h-5 text-[#0D4A2E]" />
            ) : subMode === 'reports' ? (
              <FileSpreadsheet className="w-5 h-5 text-[#0D4A2E]" />
            ) : (
              <CreditCard className="w-5 h-5 text-orange-600" />
            )}
            <span>{headerMeta.title}</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{headerMeta.desc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start lg:self-auto">
          {canTransactions && (
            <button
              type="button"
              onClick={() => {
                setSubMode('transactions');
                onStatusFilterChange?.(getDefaultStatusFilter());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                subMode === 'transactions'
                  ? 'bg-white text-slate-900 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ট্রানজেকশন ({toBn(orders.length)})
            </button>
          )}
          {canExpenses && (
            <button
              type="button"
              onClick={() => {
                setSubMode('expenses');
                onStatusFilterChange?.('expenses');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                subMode === 'expenses'
                  ? 'bg-white text-slate-900 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ব্যয় ও নিট লাভ ({toBn(expenses.length)})
            </button>
          )}
          {canReports && (
            <button
              type="button"
              onClick={() => {
                setSubMode('reports');
                onStatusFilterChange?.('reports');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                subMode === 'reports'
                  ? 'bg-white text-slate-900 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              রিপোর্ট ও CSV
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: TRANSACTIONS */}
      {subMode === 'transactions' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className={isFocusedStatus ? 'md:col-span-6 relative' : 'md:col-span-5 relative'}>
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="অর্ডার আইডি, কাস্টমার নাম, ফোন বা TrxID দিয়ে খুঁজুন..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-100 bg-white font-medium"
              />
            </div>

            <div className={isFocusedStatus ? 'md:col-span-4' : 'md:col-span-3'}>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-100 bg-white font-bold text-gray-600"
              >
                <option value="all">সকল পেমেন্ট পদ্ধতি</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="rocket">রকেট (Rocket)</option>
                <option value="cod">ক্যাশ অন ডেলিভারি (COD)</option>
              </select>
            </div>

            {!isFocusedStatus && (
              <div className="md:col-span-2">
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-100 bg-white font-bold text-gray-600"
                >
                  {canOpt('all') && <option value="all">সকল অবস্থা</option>}
                  {canOpt('pending') && <option value="pending">যাচাই বাকি / পেন্ডিং</option>}
                  {canOpt('approved') && <option value="approved">অনুমোদিত / যাচাইকৃত</option>}
                  {canOpt('cancelled') && <option value="cancelled">বাতিলকৃত</option>}
                </select>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={handleExportTransactionsCsv}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    <th className="p-4">অর্ডার আইডি ও তারিখ</th>
                    <th className="p-4">গ্রাহকের নাম ও ফোন</th>
                    <th className="p-4">পেমেন্ট পদ্ধতি</th>
                    <th className="p-4">টাকা পাঠানো নম্বর</th>
                    <th className="p-4">ট্রানজেকশন আইডি (TrxID)</th>
                    <th className="p-4 text-right">টাকার পরিমাণ</th>
                    <th className="p-4 text-center">স্ট্যাটাস ও যাচাই</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">
                        কোন ট্রানজেকশন বা পেমেন্ট পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-gray-800 font-mono">#{order.id}</span>
                            <span className="text-[10px] text-gray-400 font-bold mt-0.5 tabular-nums">
                              {order.createdAt}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{order.customerName}</span>
                            <span className="text-[10px] text-gray-400 font-mono tabular-nums mt-0.5">
                              {order.customerPhone}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold uppercase text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md text-[10px]">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4">
                          {order.bkashNumber ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-800 font-mono tabular-nums">
                                {order.bkashNumber}
                              </span>
                              <button
                                onClick={() => handleCopy(order.bkashNumber!, `num-${order.id}`)}
                                className="text-gray-400 hover:text-orange-500 transition-colors p-0.5 cursor-pointer border-0 bg-transparent"
                                title="নম্বর কপি করুন"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {copiedTextId === `num-${order.id}` && (
                                <span className="text-[9px] text-emerald-600 font-extrabold">কপিড</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 font-bold">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {order.trxId ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-50 px-1.5 py-0.5 border rounded text-slate-700 font-bold text-[11px] select-all">
                                {order.trxId}
                              </span>
                              <button
                                onClick={() => handleCopy(order.trxId!, `trx-${order.id}`)}
                                className="text-gray-400 hover:text-orange-500 transition-colors p-0.5 cursor-pointer border-0 bg-transparent"
                                title="TrxID কপি করুন"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {copiedTextId === `trx-${order.id}` && (
                                <span className="text-[9px] text-emerald-600 font-extrabold">কপিড</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 font-bold">—</span>
                          )}
                        </td>
                        <td className="p-4 font-extrabold text-gray-900 text-right text-sm font-mono tabular-nums">
                          {formatMoney(order.totalAmount)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block ${
                                order.status === 'pending'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : order.status === 'processing'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : order.status === 'shipped'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : order.status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {order.status === 'pending'
                                ? 'পেন্ডিং'
                                : order.status === 'processing'
                                ? 'প্রসেসিং'
                                : order.status === 'shipped'
                                ? 'শিপড্'
                                : order.status === 'delivered'
                                ? 'ডেলিভার্ড'
                                : 'বাতিল'}
                            </span>
                            {order.paymentMethod !== 'cod' && order.status !== 'cancelled' && (
                              <span
                                className={`text-[10px] font-bold ${
                                  order.isPaymentVerified ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                              >
                                {order.isPaymentVerified ? '✓ TrxID যাচাইকৃত' : 'যাচাই বাকি'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {order.paymentMethod !== 'cod' &&
                              !order.isPaymentVerified &&
                              order.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyDigitalPayment(order)}
                                  className="bg-[#0D4A2E] hover:bg-emerald-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>যাচাই</span>
                                </button>
                              )}

                            {order.status === 'pending' && order.paymentMethod === 'cod' && (
                              pendingConfirmOrderId === order.id ? (
                                <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 p-1 rounded-lg">
                                  <input
                                    type="text"
                                    placeholder="247"
                                    value={confirmCodeInput}
                                    onChange={(e) => setConfirmCodeInput(e.target.value)}
                                    className="w-11 px-1 py-0.5 border border-orange-300 rounded text-[10px] bg-white text-center font-extrabold"
                                  />
                                  <button
                                    onClick={() => {
                                      if (confirmCodeInput === '247') {
                                        onUpdateOrderStatus(order.id, 'processing');
                                        notify(`অর্ডার ${order.id} কনফার্ম (প্রসেসিং) করা হয়েছে।`, 'success');
                                        setPendingConfirmOrderId(null);
                                        setConfirmCodeInput('');
                                      } else {
                                        notify('ভুল কোড! সঠিক কোড দিন।', 'error');
                                      }
                                    }}
                                    className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer"
                                  >
                                    ওকে
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPendingConfirmOrderId(null);
                                      setConfirmCodeInput('');
                                    }}
                                    className="bg-gray-200 text-gray-700 text-[9px] font-black px-1 py-0.5 rounded cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setPendingConfirmOrderId(order.id);
                                    setConfirmCodeInput('');
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer"
                                >
                                  কনফার্ম
                                </button>
                              )
                            )}

                            <button
                              onClick={() => setSelectedPaymentOrder(order)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer"
                            >
                              বিবরণী
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: EXPENSE LEDGER & NET PROFIT */}
      {subMode === 'expenses' && (
        <div className="space-y-5">
          {/* P&L Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500">পণ্য বিক্রয় আয় (ডেলিভারি ছাড়া)</p>
              <p className="text-xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
                {formatMoney(financialSummary.productSales)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500">পণ্যের ক্রয়মূল্য (COGS)</p>
              <p className="text-xl font-extrabold text-amber-700 font-mono tabular-nums mt-1">
                {formatMoney(financialSummary.totalCogs)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500">মোট ব্যবসায়িক খরচ</p>
              <p className="text-xl font-extrabold text-rose-600 font-mono tabular-nums mt-1">
                {formatMoney(financialSummary.totalExpenses)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500">প্রকৃত নিট লাভ</p>
              <p
                className={`text-xl font-extrabold font-mono tabular-nums mt-1 ${
                  financialSummary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {formatMoney(financialSummary.netProfit)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Add Expense Form */}
            <form
              onSubmit={handleAddExpenseSubmit}
              className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 h-fit"
            >
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Plus className="w-4 h-4 text-[#0D4A2E]" />
                <span>নতুন খরচ যোগ করুন</span>
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  খরচের বিবরণ / শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হিমসাগর আম প্যাকিং কার্টন ক্রয়"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50 focus:bg-white focus:outline-hidden focus:border-[#0D4A2E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden"
                  >
                    {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((k) => (
                      <option key={k} value={k}>
                        {EXPENSE_CATEGORY_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    টাকার পরিমাণ (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="৫০০"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono tabular-nums bg-slate-50 focus:bg-white focus:outline-hidden focus:border-[#0D4A2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    সংক্ষিপ্ত নোট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="ভাউচার বা রেফারেন্স..."
                    value={expNote}
                    onChange={(e) => setExpNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingExpense}
                className="w-full py-2.5 bg-[#0D4A2E] hover:bg-emerald-900 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
              >
                {isSavingExpense ? 'সংরক্ষণ হচ্ছে...' : 'খরচ লিপিবদ্ধ করুন'}
              </button>

              {/* Category Summary */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <p className="text-[11px] font-extrabold text-slate-500">ক্যাটাগরি অনুযায়ী মোট ব্যয়</p>
                {financialSummary.categoryTotals.map((c) => (
                  <div
                    key={c.category}
                    className="flex items-center justify-between text-xs py-1 text-slate-700"
                  >
                    <span className="font-medium">{c.label}</span>
                    <span className="font-bold font-mono tabular-nums">{formatMoney(c.amount)}</span>
                  </div>
                ))}
              </div>
            </form>

            {/* Expense Ledger Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-extrabold text-slate-900 text-sm">খরচের খাতা (Expense Ledger)</h4>
                <select
                  value={expFilterCategory}
                  onChange={(e) => setExpFilterCategory(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50"
                >
                  <option value="all">সব ক্যাটাগরি</option>
                  {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((k) => (
                    <option key={k} value={k}>
                      {EXPENSE_CATEGORY_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase">
                      <th className="p-3.5">তারিখ</th>
                      <th className="p-3.5">বিবরণ ও ক্যাটাগরি</th>
                      <th className="p-3.5 text-right">পরিমাণ</th>
                      <th className="p-3.5 text-center">মুছুন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.filter(
                      (ex) => expFilterCategory === 'all' || ex.category === expFilterCategory
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-400 font-bold">
                          কোনো ব্যবসায়িক খরচ এখনো যোগ করা হয়নি। বাম পাশের ফর্ম থেকে প্রথম খরচটি যোগ করুন।
                        </td>
                      </tr>
                    ) : (
                      expenses
                        .filter(
                          (ex) => expFilterCategory === 'all' || ex.category === expFilterCategory
                        )
                        .map((ex) => (
                          <tr key={ex.id} className="hover:bg-slate-50/60">
                            <td className="p-3.5 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                              {ex.date}
                            </td>
                            <td className="p-3.5">
                              <p className="font-bold text-slate-800">{ex.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {EXPENSE_CATEGORY_LABELS[ex.category] || ex.category}
                                {ex.note ? ` · ${ex.note}` : ''}
                              </p>
                            </td>
                            <td className="p-3.5 text-right font-extrabold text-rose-600 font-mono tabular-nums">
                              {formatMoney(ex.amount)}
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => setExpenseToDelete(ex)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MONTHLY REPORTS & CSV EXPORT */}
      {subMode === 'reports' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#0D4A2E]" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">মাসভিত্তিক সারসংক্ষেপ</h4>
                <p className="text-xs text-slate-500">নির্দিষ্ট মাস নির্বাচন করে বিক্রয় ও লাভের হিসাব দেখুন</p>
              </div>
            </div>

            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 cursor-pointer"
            >
              <option value="all">সকল সময় (All Time)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  মাস: {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500">মোট অর্ডার / ডেলিভার্ড</p>
              <p className="text-lg font-extrabold text-slate-900 tabular-nums mt-1">
                {toBn(reportStats.mActive.length)}টি / {toBn(reportStats.mDelivered.length)}টি
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500">মোট বিক্রয় ও ডেলিভারি</p>
              <p className="text-lg font-extrabold text-slate-900 font-mono tabular-nums mt-1">
                {formatMoney(reportStats.grossSales)}
              </p>
              <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                ডিসকাউন্ট: {formatMoney(reportStats.discountsGiven)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500">মোট খরচ (COGS + ব্যয়)</p>
              <p className="text-lg font-extrabold text-rose-600 font-mono tabular-nums mt-1">
                {formatMoney(reportStats.cogs + reportStats.expTotal)}
              </p>
              <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                ব্যয় খাত: {formatMoney(reportStats.expTotal)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500">নিট লাভ ও সেলার কমিশন</p>
              <p
                className={`text-lg font-extrabold font-mono tabular-nums mt-1 ${
                  reportStats.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {formatMoney(reportStats.netProfit)}
              </p>
              <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                উদ্যোক্তা কমিশন আয়: {formatMoney(reportStats.commissionEarned)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
              <div>
                <h5 className="font-extrabold text-slate-900 text-sm">বিক্রয় ও অর্ডার রিপোর্ট</h5>
                <p className="text-xs text-slate-500 mt-1">
                  নির্বাচিত সময়ের {toBn(reportStats.mOrders.length)}টি অর্ডার, গ্রাহক ও COGS-সহ Excel (CSV) শিট।
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportMonthlyOrdersCsv}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0D4A2E] hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>বিক্রয় CSV ডাউনলোড</span>
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
              <div>
                <h5 className="font-extrabold text-slate-900 text-sm">ব্যয় ও খরচ হিসাব</h5>
                <p className="text-xs text-slate-500 mt-1">
                  নির্বাচিত সময়ের {toBn(reportStats.mExpenses.length)}টি খরচের পূর্ণাঙ্গ তালিকা CSV ফরম্যাটে।
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportExpensesCsv}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>খরচ CSV ডাউনলোড</span>
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
              <div>
                <h5 className="font-extrabold text-slate-900 text-sm">ইনভেন্টরি ও স্টক মূল্যায়ন</h5>
                <p className="text-xs text-slate-500 mt-1">
                  বর্তমান {toBn(products.length)}টি পণ্যের স্টক, ক্রয়মূল্য ও বিক্রয়মূল্যের হিসাব।
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportInventoryCsv}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ইনভেন্টরি CSV ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Payment Detail Overlay Modal */}
      {selectedPaymentOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-orange-600 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>পেমেন্ট বিস্তারিত (ID: {selectedPaymentOrder.id})</span>
              </h3>
              <button
                onClick={() => setSelectedPaymentOrder(null)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 border">
                <p className="font-extrabold text-gray-800 border-b border-gray-200 pb-1 mb-1">
                  গ্রাহকের বিবরণী
                </p>
                <p>
                  <span className="text-gray-400 font-bold">নাম:</span>{' '}
                  <strong className="text-gray-800">{selectedPaymentOrder.customerName}</strong>
                </p>
                <p>
                  <span className="text-gray-400 font-bold">মোবাইল:</span>{' '}
                  <strong className="text-gray-800">{selectedPaymentOrder.customerPhone}</strong>
                </p>
                <p>
                  <span className="text-gray-400 font-bold">ঠিকানা:</span>{' '}
                  <strong className="text-gray-800">
                    {selectedPaymentOrder.deliveryAddress}, {selectedPaymentOrder.area},{' '}
                    {selectedPaymentOrder.district}
                  </strong>
                </p>
              </div>

              <div className="bg-orange-50/50 p-3 rounded-xl space-y-1.5 border border-orange-100">
                <p className="font-extrabold text-orange-800 border-b border-orange-200 pb-1 mb-1">
                  লেনদেন ও টাকার বিবরণী
                </p>
                <p>
                  <span className="text-gray-400 font-bold">পেমেন্ট পদ্ধতি:</span>{' '}
                  <strong className="text-gray-800 font-mono uppercase">
                    {selectedPaymentOrder.paymentMethod}
                  </strong>
                </p>
                {selectedPaymentOrder.bkashNumber && (
                  <p>
                    <span className="text-gray-400 font-bold">টাকা পাঠানোর নম্বর:</span>{' '}
                    <strong className="text-gray-800 font-mono">
                      {selectedPaymentOrder.bkashNumber}
                    </strong>
                  </p>
                )}
                {selectedPaymentOrder.trxId && (
                  <p>
                    <span className="text-gray-400 font-bold">ট্রানজেকশন আইডি (TrxID):</span>{' '}
                    <strong className="text-gray-800 font-mono bg-orange-100/50 px-1.5 py-0.5 rounded">
                      {selectedPaymentOrder.trxId}
                    </strong>
                  </p>
                )}
                <p>
                  <span className="text-gray-400 font-bold">সর্বমোট টাকার পরিমাণ:</span>{' '}
                  <strong className="text-orange-600 text-sm font-black font-mono tabular-nums">
                    ৳{selectedPaymentOrder.totalAmount}
                  </strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-extrabold text-gray-800">অর্ডারকৃত পণ্য তালিকা</p>
                <div className="divide-y max-h-40 overflow-y-auto pr-1">
                  {selectedPaymentOrder.items.map((item, index) => (
                    <div key={index} className="py-2 flex justify-between items-center">
                      <span className="font-bold text-gray-700 max-w-[200px] truncate">
                        {item.productName} ({item.unit})
                      </span>
                      <span className="font-extrabold text-gray-500 font-mono tabular-nums">
                        ৳{item.price} × {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end gap-2">
              {selectedPaymentOrder.paymentMethod !== 'cod' &&
                !selectedPaymentOrder.isPaymentVerified &&
                selectedPaymentOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleVerifyDigitalPayment(selectedPaymentOrder);
                      setSelectedPaymentOrder({
                        ...selectedPaymentOrder,
                        isPaymentVerified: true,
                        status:
                          selectedPaymentOrder.status === 'pending'
                            ? 'processing'
                            : selectedPaymentOrder.status,
                      });
                    }}
                    className="px-4 py-2 bg-[#0D4A2E] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    পেমেন্ট যাচাই সম্পন্ন করুন
                  </button>
                )}
              <button
                onClick={() => setSelectedPaymentOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl cursor-pointer border-0"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(expenseToDelete)}
        title="ব্যয়ের রেকর্ড মুছে ফেলতে চান?"
        description={
          expenseToDelete && (
            <>
              আপনি কি নিশ্চিতভাবে <strong className="text-slate-900">"{expenseToDelete.title}"</strong> ({formatMoney(expenseToDelete.amount)}) খরচের রেকর্ডটি ডিলিট করতে চান?
            </>
          )
        }
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={async () => {
          if (!expenseToDelete) return;
          if (onDeleteExpense) {
            await onDeleteExpense(expenseToDelete.id);
            notify('খরচের রেকর্ড মুছে ফেলা হয়েছে।', 'info');
          }
          setExpenseToDelete(null);
        }}
      />
    </div>
  );
}
