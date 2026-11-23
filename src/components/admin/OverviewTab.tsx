import React, { useMemo, useState } from 'react';
import {
  DollarSign,
  Check,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
  CreditCard,
  ShieldAlert,
  RefreshCw,
  ArrowUpRight,
  MapPin,
  Award,
  BarChart3,
  Repeat,
} from 'lucide-react';
import {
  Product,
  Order,
  Expense,
  Complaint,
  ProductRequest,
  WithdrawRequest,
  User,
} from '../../types';
import { getValidImageSrc, handleImageError } from '../../utils/imageUtils';
import {
  toBn,
  formatMoney,
  parseFlexibleDate,
  getDateKey,
  calculateOrderCogs,
  normalizePhoneNumber,
} from './adminUtils';

export interface OverviewNavigateTarget {
  tab:
    | 'overview'
    | 'products'
    | 'orders'
    | 'complaints'
    | 'marketing'
    | 'chats'
    | 'payments'
    | 'requests'
    | 'users'
    | 'sellers'
    | 'reviews';
  orderStatus?: string;
  paymentStatus?: string;
  productView?: 'list' | 'add' | 'categories';
  stockMode?: 'all' | 'low' | 'out';
  complaintStatus?: 'all' | 'pending' | 'in_progress' | 'resolved';
  requestStatus?: 'all' | 'pending' | 'contacted' | 'completed';
  sellerTab?: 'applications' | 'products' | 'withdraws' | 'settings';
}

interface OverviewTabProps {
  totalRevenue: number;
  completedRevenue: number;
  orders: Order[];
  pendingOrdersCount: number;
  products: Product[];
  expenses?: Expense[];
  complaints?: Complaint[];
  productRequests?: ProductRequest[];
  withdrawRequests?: WithdrawRequest[];
  users?: User[];
  setActiveTab: (
    tab:
      | 'overview'
      | 'products'
      | 'orders'
      | 'complaints'
      | 'marketing'
      | 'chats'
      | 'payments'
      | 'requests'
      | 'users'
      | 'sellers'
      | 'reviews'
  ) => void;
  onNavigateFilter?: (target: OverviewNavigateTarget) => void;
  canViewFinancials?: boolean;
  canViewAnalytics?: boolean;
  canNavigateTarget?: (target: OverviewNavigateTarget) => boolean;
}

type PeriodFilter = 'all' | 'today' | '7d' | '30d';

export default function OverviewTab({
  orders,
  pendingOrdersCount,
  products,
  expenses = [],
  complaints = [],
  productRequests = [],
  withdrawRequests = [],
  users = [],
  setActiveTab,
  onNavigateFilter,
  canViewFinancials = true,
  canViewAnalytics = true,
  canNavigateTarget,
}: OverviewTabProps) {
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(7);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>(canViewFinancials ? 'revenue' : 'orders');
  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);

  const canGo = (target: OverviewNavigateTarget) => (canNavigateTarget ? canNavigateTarget(target) : true);

  React.useEffect(() => {
    if (!canViewFinancials && chartMetric === 'revenue') {
      setChartMetric('orders');
    }
  }, [canViewFinancials, chartMetric]);

  const navigateTo = (target: OverviewNavigateTarget) => {
    if (onNavigateFilter) {
      onNavigateFilter(target);
    } else {
      setActiveTab(target.tab);
    }
  };

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const requestCountByProduct = useMemo(() => {
    const m = new Map<string, number>();
    productRequests
      .filter((r) => r.status !== 'completed')
      .forEach((r) => {
        m.set(r.productId, (m.get(r.productId) || 0) + 1);
      });
    return m;
  }, [productRequests]);

  // Anchor date for relative periods: if no orders fall in real "today" window, still allow real today check cleanly
  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getDateKey(now), [now]);

  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    const cutoff = new Date(now);
    if (period === 'today') {
      return orders.filter((o) => {
        const d = parseFlexibleDate(o.createdAt);
        return d ? getDateKey(d) === todayKey : false;
      });
    }
    const days = period === '7d' ? 7 : 30;
    cutoff.setDate(cutoff.getDate() - (days - 1));
    cutoff.setHours(0, 0, 0, 0);
    return orders.filter((o) => {
      const d = parseFlexibleDate(o.createdAt);
      return d ? d.getTime() >= cutoff.getTime() : false;
    });
  }, [orders, period, now, todayKey]);

  const filteredExpenses = useMemo(() => {
    if (period === 'all') return expenses;
    const cutoff = new Date(now);
    if (period === 'today') {
      return expenses.filter((ex) => {
        const d = parseFlexibleDate(ex.date || ex.createdAt);
        return d ? getDateKey(d) === todayKey : false;
      });
    }
    const days = period === '7d' ? 7 : 30;
    cutoff.setDate(cutoff.getDate() - (days - 1));
    cutoff.setHours(0, 0, 0, 0);
    return expenses.filter((ex) => {
      const d = parseFlexibleDate(ex.date || ex.createdAt);
      return d ? d.getTime() >= cutoff.getTime() : false;
    });
  }, [expenses, period, now, todayKey]);

  // Core KPI Calculations
  const kpis = useMemo(() => {
    const activeOrders = filteredOrders.filter((o) => o.status !== 'cancelled');
    const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered');
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled');

    const grossSales = activeOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const collectedRevenue = deliveredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    // Product revenue (excluding delivery charge) & COGS
    const productSalesRevenue = activeOrders.reduce(
      (s, o) => s + Math.max(0, (o.totalAmount || 0) - (o.deliveryCharge || 0)),
      0
    );
    const totalCogs = activeOrders.reduce(
      (s, o) => s + calculateOrderCogs(o, productMap),
      0
    );
    const totalExpenses = filteredExpenses.reduce((s, ex) => s + (ex.amount || 0), 0);
    const netProfit = productSalesRevenue - totalCogs - totalExpenses;
    const profitMargin =
      productSalesRevenue > 0 ? Math.round((netProfit / productSalesRevenue) * 100) : 0;

    const aov =
      activeOrders.length > 0 ? Math.round(grossSales / activeOrders.length) : 0;
    const cancelRate =
      filteredOrders.length > 0
        ? Math.round((cancelledOrders.length / filteredOrders.length) * 100)
        : 0;

    // Repeat Customer Rate
    const phoneCounts = new Map<string, number>();
    activeOrders.forEach((o) => {
      const p = normalizePhoneNumber(o.customerPhone);
      if (p) phoneCounts.set(p, (phoneCounts.get(p) || 0) + 1);
    });
    const uniqueCustomers = phoneCounts.size;
    let repeatCustomers = 0;
    phoneCounts.forEach((count) => {
      if (count > 1) repeatCustomers += 1;
    });
    const repeatRate =
      uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;

    const pipelineCount = filteredOrders.filter(
      (o) => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped'
    ).length;

    const codCount = activeOrders.filter((o) => o.paymentMethod === 'cod').length;
    const digitalCount = activeOrders.length - codCount;

    return {
      grossSales,
      collectedRevenue,
      netProfit,
      profitMargin,
      totalExpenses,
      totalCogs,
      aov,
      cancelRate,
      repeatRate,
      repeatCustomers,
      uniqueCustomers,
      activeCount: activeOrders.length,
      deliveredCount: deliveredOrders.length,
      cancelledCount: cancelledOrders.length,
      pipelineCount,
      codCount,
      digitalCount,
    };
  }, [filteredOrders, filteredExpenses, productMap]);

  // Action Needed Alerts (live counts across whole store)
  const actionAlerts = useMemo(() => {
    const unverifiedDigital = orders.filter(
      (o) =>
        o.status !== 'cancelled' &&
        o.paymentMethod !== 'cod' &&
        !o.isPaymentVerified &&
        o.status === 'pending'
    ).length;

    const unresolvedComplaints = complaints.filter(
      (c) => c.status === 'pending' || c.status === 'in_progress'
    ).length;

    const pendingReqCount = productRequests.filter((r) => r.status === 'pending').length;

    const outOfStockCount = products.filter((p) => p.stock <= 0).length;
    const lowStockCount = products.filter(
      (p) => p.stock > 0 && p.stock <= (p.reorderLevel ?? 5)
    ).length;

    const pendingSellers = users.filter(
      (u) => u.role === 'seller' && u.sellerStatus === 'pending'
    ).length;
    const pendingSellerProducts = products.filter(
      (p) => p.sellerId && p.sellerProductStatus === 'pending'
    ).length;
    const pendingWithdraws = withdrawRequests.filter((w) => w.status === 'pending').length;

    return {
      unverifiedDigital,
      unresolvedComplaints,
      pendingReqCount,
      outOfStockCount,
      lowStockCount,
      pendingSellerTotal: pendingSellers + pendingSellerProducts + pendingWithdraws,
      pendingWithdraws,
    };
  }, [orders, complaints, productRequests, products, users, withdrawRequests]);

  // Daily Chart Series (smart anchor: latest order date if today's window is empty, or today)
  const chartData = useMemo(() => {
    const parsedDates = orders
      .map((o) => parseFlexibleDate(o.createdAt))
      .filter((d): d is Date => Boolean(d));

    const recentWindowStart = new Date(now);
    recentWindowStart.setDate(recentWindowStart.getDate() - (chartDays - 1));
    recentWindowStart.setHours(0, 0, 0, 0);

    const hasRecentOrders = parsedDates.some(
      (d) => d.getTime() >= recentWindowStart.getTime() && d.getTime() <= now.getTime() + 86400000
    );

    let endAnchor = new Date(now);
    if (!hasRecentOrders && parsedDates.length > 0) {
      // Anchor chart on the latest recorded order date so historical/seeded orders display cleanly
      endAnchor = parsedDates.reduce((max, d) => (d.getTime() > max.getTime() ? d : max), parsedDates[0]);
    }
    endAnchor.setHours(0, 0, 0, 0);

    const dayBuckets: {
      key: string;
      label: string;
      shortLabel: string;
      revenue: number;
      ordersCount: number;
    }[] = [];

    const bucketMap = new Map<
      string,
      { revenue: number; ordersCount: number }
    >();

    for (let i = chartDays - 1; i >= 0; i--) {
      const dt = new Date(endAnchor);
      dt.setDate(dt.getDate() - i);
      const key = getDateKey(dt);
      bucketMap.set(key, { revenue: 0, ordersCount: 0 });
      dayBuckets.push({
        key,
        label: dt.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
        shortLabel:
          chartDays === 7
            ? dt.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })
            : toBn(dt.getDate()),
        revenue: 0,
        ordersCount: 0,
      });
    }

    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => {
        const dt = parseFlexibleDate(o.createdAt);
        if (!dt) return;
        const key = getDateKey(dt);
        const bucket = bucketMap.get(key);
        if (bucket) {
          bucket.revenue += o.totalAmount || 0;
          bucket.ordersCount += 1;
        }
      });

    return dayBuckets.map((b) => {
      const vals = bucketMap.get(b.key)!;
      return {
        ...b,
        revenue: vals.revenue,
        ordersCount: vals.ordersCount,
      };
    });
  }, [orders, chartDays, now]);

  const maxChartVal = useMemo(() => {
    const vals = chartData.map((d) =>
      chartMetric === 'revenue' ? d.revenue : d.ordersCount
    );
    return Math.max(1, ...vals);
  }, [chartData, chartMetric]);

  const activeHoverDay = useMemo(() => {
    if (!hoveredDayKey) return null;
    return chartData.find((d) => d.key === hoveredDayKey) || null;
  }, [chartData, hoveredDayKey]);

  // Status & Payment breakdown
  const statusBreakdown = useMemo(() => {
    const total = Math.max(1, filteredOrders.length);
    const items = [
      {
        key: 'pending',
        label: 'অপেক্ষমাণ',
        count: filteredOrders.filter((o) => o.status === 'pending').length,
        bar: 'bg-amber-500',
        text: 'text-amber-700',
      },
      {
        key: 'processing',
        label: 'প্রসেসিং',
        count: filteredOrders.filter((o) => o.status === 'processing').length,
        bar: 'bg-indigo-500',
        text: 'text-indigo-700',
      },
      {
        key: 'shipped',
        label: 'শিপড্',
        count: filteredOrders.filter((o) => o.status === 'shipped').length,
        bar: 'bg-sky-500',
        text: 'text-sky-700',
      },
      {
        key: 'delivered',
        label: 'ডেলিভার্ড',
        count: filteredOrders.filter((o) => o.status === 'delivered').length,
        bar: 'bg-emerald-600',
        text: 'text-emerald-700',
      },
      {
        key: 'cancelled',
        label: 'বাতিল',
        count: filteredOrders.filter((o) => o.status === 'cancelled').length,
        bar: 'bg-rose-500',
        text: 'text-rose-700',
      },
    ];
    return items.map((item) => ({
      ...item,
      pct: Math.round((item.count / total) * 100),
    }));
  }, [filteredOrders]);

  const paymentSplit = useMemo(() => {
    const active = filteredOrders.filter((o) => o.status !== 'cancelled');
    const methods = [
      { key: 'cod', label: 'COD' },
      { key: 'bkash', label: 'বিকাশ' },
      { key: 'nagad', label: 'নগদ' },
      { key: 'rocket', label: 'রকেট' },
    ];
    return methods.map((m) => {
      const list = active.filter((o) => o.paymentMethod === m.key);
      return {
        ...m,
        count: list.length,
        amount: list.reduce((s, o) => s + (o.totalAmount || 0), 0),
      };
    });
  }, [filteredOrders]);

  // Top 5 Products
  const topProducts = useMemo(() => {
    const agg = new Map<
      string,
      {
        id: string;
        name: string;
        image: string;
        qty: number;
        revenue: number;
      }
    >();
    filteredOrders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => {
        o.items.forEach((item) => {
          const key = item.productId || item.productName;
          const prev = agg.get(key) || {
            id: item.productId,
            name: item.productName,
            image: item.image,
            qty: 0,
            revenue: 0,
          };
          prev.qty += item.quantity || 0;
          prev.revenue += (item.price || 0) * (item.quantity || 0);
          agg.set(key, prev);
        });
      });

    return Array.from(agg.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Top 5 Districts
  const topDistricts = useMemo(() => {
    const agg = new Map<string, { district: string; count: number; revenue: number }>();
    const active = filteredOrders.filter((o) => o.status !== 'cancelled');
    active.forEach((o) => {
      const dist = (o.district || 'অন্যান্য').trim();
      const prev = agg.get(dist) || { district: dist, count: 0, revenue: 0 };
      prev.count += 1;
      prev.revenue += o.totalAmount || 0;
      agg.set(dist, prev);
    });
    const total = Math.max(1, active.length);
    return Array.from(agg.values())
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 5)
      .map((d) => ({ ...d, pct: Math.round((d.count / total) * 100) }));
  }, [filteredOrders]);

  // Low Stock list sorted by out-of-stock first + highest customer demand
  const stockAlertsList = useMemo(() => {
    return products
      .filter((p) => p.stock <= (p.reorderLevel ?? 5))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8);
  }, [products]);

  const hasAnyActionAlert =
    (pendingOrdersCount > 0 && canGo({ tab: 'orders', orderStatus: 'pending' })) ||
    (actionAlerts.unverifiedDigital > 0 && canGo({ tab: 'payments', paymentStatus: 'pending' })) ||
    (actionAlerts.unresolvedComplaints > 0 && canGo({ tab: 'complaints', complaintStatus: 'pending' })) ||
    (actionAlerts.pendingReqCount > 0 && canGo({ tab: 'requests', requestStatus: 'pending' })) ||
    (actionAlerts.outOfStockCount > 0 && canGo({ tab: 'products', productView: 'categories', stockMode: 'out' })) ||
    (actionAlerts.pendingSellerTotal > 0 && canGo({ tab: 'sellers', sellerTab: actionAlerts.pendingWithdraws > 0 ? 'withdraws' : 'applications' }));

  return (
    <div className="space-y-5">
      {/* Top Bar: Context & Period Filter */}
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight">
            ব্যবসায়িক বিশ্লেষণ ও ড্যাশবোর্ড ওভারভিউ
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5 tabular-nums">
            মোট {toBn(products.length)}টি পণ্য · {toBn(orders.length)}টি অর্ডার · {toBn(users.filter((u) => u.role === 'user').length)} জন নিবন্ধিত গ্রাহক
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {(
            [
              { id: 'all', label: 'সকল সময়' },
              { id: 'today', label: 'আজকের' },
              { id: '7d', label: 'গত ৭ দিন' },
              { id: '30d', label: 'গত ৩০ দিন' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                period === tab.id
                  ? 'bg-white text-slate-900 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Action Needed Strip */}
      {hasAnyActionAlert && (
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 mr-1">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span>তাৎক্ষণিক করণীয়:</span>
          </span>

          {pendingOrdersCount > 0 && canGo({ tab: 'orders', orderStatus: 'pending' }) && (
            <button
              type="button"
              onClick={() => navigateTo({ tab: 'orders', orderStatus: 'pending' })}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors tabular-nums"
            >
              <span>অপেক্ষমাণ অর্ডার: {toBn(pendingOrdersCount)}টি</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {actionAlerts.unverifiedDigital > 0 && canGo({ tab: 'payments', paymentStatus: 'pending' }) && (
            <button
              type="button"
              onClick={() => navigateTo({ tab: 'payments', paymentStatus: 'pending' })}
              className="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors tabular-nums"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>পেমেন্ট যাচাই বাকি: {toBn(actionAlerts.unverifiedDigital)}টি</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {actionAlerts.unresolvedComplaints > 0 && canGo({ tab: 'complaints', complaintStatus: 'pending' }) && (
            <button
              type="button"
              onClick={() => navigateTo({ tab: 'complaints', complaintStatus: 'pending' })}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors tabular-nums"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>চলমান অভিযোগ: {toBn(actionAlerts.unresolvedComplaints)}টি</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {actionAlerts.pendingReqCount > 0 && canGo({ tab: 'requests', requestStatus: 'pending' }) && (
            <button
              type="button"
              onClick={() => navigateTo({ tab: 'requests', requestStatus: 'pending' })}
              className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors tabular-nums"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>স্টক রিকুয়েস্ট: {toBn(actionAlerts.pendingReqCount)}টি</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {actionAlerts.outOfStockCount > 0 && canGo({ tab: 'products', productView: 'categories', stockMode: 'out' }) && (
            <button
              type="button"
              onClick={() =>
                navigateTo({ tab: 'products', productView: 'categories', stockMode: 'out' })
              }
              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors tabular-nums"
            >
              <Package className="w-3.5 h-3.5" />
              <span>স্টক শেষ: {toBn(actionAlerts.outOfStockCount)}টি</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {actionAlerts.pendingSellerTotal > 0 && canGo({ tab: 'sellers', sellerTab: actionAlerts.pendingWithdraws > 0 ? 'withdraws' : 'applications' }) && (
            <button
              type="button"
              onClick={() =>
                navigateTo({
                  tab: 'sellers',
                  sellerTab: actionAlerts.pendingWithdraws > 0 ? 'withdraws' : 'applications',
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors tabular-nums"
            >
              <span>উদ্যোক্তা পেন্ডিং: {toBn(actionAlerts.pendingSellerTotal)}টি</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Executive KPI Grid (5 Cards) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${canViewFinancials ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-2'} gap-4`}>
        {/* 1. Gross Sales */}
        {canViewFinancials && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">মোট বিক্রয়</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-extrabold text-slate-900 text-xl tabular-nums font-mono">
            {formatMoney(kpis.grossSales)}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold tabular-nums flex items-center gap-1.5">
            <span>{toBn(kpis.activeCount)}টি সক্রিয় অর্ডার</span>
            <span aria-hidden="true">·</span>
            <span>গড়: {formatMoney(kpis.aov)}</span>
          </div>
        </div>
        )}

        {/* 2. Collected Revenue */}
        {canViewFinancials && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">পরিশোধিত আয়</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="font-extrabold text-emerald-700 text-xl tabular-nums font-mono">
            {formatMoney(kpis.collectedRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold tabular-nums">
            ডেলিভারি সম্পন্ন: {toBn(kpis.deliveredCount)}টি অর্ডার
          </div>
        </div>
        )}

        {/* 3. Net Profit */}
        {canViewFinancials && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">প্রকৃত নিট লাভ</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                kpis.netProfit >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`font-extrabold text-xl tabular-nums font-mono ${
              kpis.netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatMoney(kpis.netProfit)}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold tabular-nums flex items-center gap-1.5">
            <span>মার্জিন: {toBn(kpis.profitMargin)}%</span>
            <span aria-hidden="true">·</span>
            <span>ব্যয়: {formatMoney(kpis.totalExpenses)}</span>
          </div>
        </div>
        )}

        {/* 4. Order Pipeline */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">চলমান পাইপলাইন</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="font-extrabold text-slate-900 text-xl tabular-nums">
            {toBn(kpis.pipelineCount)} টি
          </div>
          <div className="text-[11px] text-slate-500 font-semibold tabular-nums flex items-center gap-1.5">
            <span>নতুন: {toBn(pendingOrdersCount)}</span>
            <span aria-hidden="true">·</span>
            <span>COD: {toBn(kpis.codCount)} / ডিজিটাল: {toBn(kpis.digitalCount)}</span>
          </div>
        </div>

        {/* 5. Repeat & Cancellation Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">রিপিট ও বাতিল হার</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="font-extrabold text-slate-900 text-xl font-mono">
              {toBn(kpis.repeatRate)}%
            </span>
            <span className="text-xs text-slate-400 font-bold">রিপিট</span>
            <span className="text-slate-300">/</span>
            <span
              className={`font-extrabold text-base font-mono ${
                kpis.cancelRate > 15 ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              {toBn(kpis.cancelRate)}%
            </span>
            <span className="text-xs text-slate-400 font-bold">বাতিল</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold tabular-nums">
            মোট {toBn(kpis.uniqueCustomers)} জন গ্রাহক · {toBn(kpis.cancelledCount)}টি বাতিল
          </div>
        </div>
      </div>

      {/* Analytics Row: Daily Bar Chart + Status & Payment Breakdown */}
      {canViewAnalytics && (
      <>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Daily Revenue / Orders Bar Chart */}
        <div className="xl:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-[#0D4A2E]" />
                <span>{canViewFinancials ? 'দৈনিক বিক্রয় ও অর্ডারের ধারা' : 'দৈনিক অর্ডারের ধারা'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 tabular-nums">
                {activeHoverDay
                  ? `${activeHoverDay.label}: ${canViewFinancials ? `${formatMoney(activeHoverDay.revenue)} · ` : ''}${toBn(
                      activeHoverDay.ordersCount
                    )}টি অর্ডার`
                  : chartData.length > 0
                  ? `${chartData[0].label} – ${chartData[chartData.length - 1].label} (${toBn(
                      chartDays
                    )} দিনের চিত্র)`
                  : 'বারগুলোর উপর মাউস রাখলে বিস্তারিত দেখা যাবে'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                {canViewFinancials && (
                <button
                  type="button"
                  onClick={() => setChartMetric('revenue')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    chartMetric === 'revenue'
                      ? 'bg-white text-slate-900 shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  বিক্রয় (৳)
                </button>
                )}
                <button
                  type="button"
                  onClick={() => setChartMetric('orders')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    chartMetric === 'orders'
                      ? 'bg-white text-slate-900 shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  অর্ডার (টি)
                </button>
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold tabular-nums">
                {([7, 14, 30] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setChartDays(d)}
                    className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                      chartDays === d
                        ? 'bg-[#0D4A2E] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {toBn(d)} দিন
                  </button>
                ))}
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-center text-slate-400 text-xs gap-2">
              <p className="font-bold">এখনো কোনো অর্ডার না থাকায় চার্ট তৈরি হয়নি</p>
              <button
                type="button"
                onClick={() => navigateTo({ tab: 'orders' })}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                অর্ডার প্যানেলে যান
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <div className="h-52 flex items-end gap-1.5 sm:gap-2 border-b border-slate-200 pb-2">
                {chartData.map((day) => {
                  const val = chartMetric === 'revenue' ? day.revenue : day.ordersCount;
                  const heightPct = val > 0 ? Math.max(8, Math.round((val / maxChartVal) * 100)) : 3;
                  const isHovered = hoveredDayKey === day.key;
                  return (
                    <div
                      key={day.key}
                      onMouseEnter={() => setHoveredDayKey(day.key)}
                      onMouseLeave={() => setHoveredDayKey(null)}
                      className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                    >
                      {isHovered && (
                        <div className="absolute -top-9 z-20 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap tabular-nums pointer-events-none">
                          {day.label}:{' '}
                          {chartMetric === 'revenue'
                            ? formatMoney(day.revenue)
                            : `${toBn(day.ordersCount)}টি`}
                        </div>
                      )}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[34px] rounded-t-md transition-all duration-150 ${
                          val === 0
                            ? 'bg-slate-100'
                            : isHovered
                            ? 'bg-orange-500'
                            : 'bg-[#0D4A2E]/85 hover:bg-orange-500'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-1 pt-2 overflow-hidden">
                {chartData.map((day, idx) => {
                  const showLabel =
                    chartDays === 7 ||
                    (chartDays === 14 && idx % 2 === 0) ||
                    (chartDays === 30 && (idx % 5 === 0 || idx === chartData.length - 1));
                  return (
                    <div
                      key={day.key}
                      className="flex-1 text-center text-[10px] text-slate-500 font-semibold tabular-nums truncate"
                    >
                      {showLabel ? day.shortLabel : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status & Payment Method Breakdown */}
        <div className="xl:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
              অর্ডার স্ট্যাটাস বিশ্লেষণ
            </h3>
            <div className="space-y-3 mt-3">
              {statusBreakdown.map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => navigateTo({ tab: 'orders', orderStatus: st.key })}
                  className="w-full text-left space-y-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 group-hover:text-slate-950">{st.label}</span>
                    <span className={`tabular-nums font-mono ${st.text}`}>
                      {toBn(st.count)}টি ({toBn(st.pct)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${st.pct}%` }}
                      className={`h-full rounded-full ${st.bar} transition-all duration-300`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {canViewFinancials && (
          <div className="pt-3 border-t border-slate-100">
            <h4 className="font-extrabold text-slate-800 text-xs mb-2.5">
              পেমেন্ট মাধ্যম বিভাজন
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {paymentSplit.map((pm) => (
                <div
                  key={pm.key}
                  className="bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>{pm.label}</span>
                    <span className="tabular-nums">{toBn(pm.count)}টি</span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatMoney(pm.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Rankings Row: Top Products & Top Districts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 5 Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-orange-600" />
              <span>শীর্ষ ৫টি বিক্রিত পণ্য</span>
            </h3>
            <button
              type="button"
              onClick={() => navigateTo({ tab: 'products', productView: 'list' })}
              className="text-xs font-bold text-[#0D4A2E] hover:underline cursor-pointer"
            >
              সব পণ্য দেখুন
            </button>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-medium">
              এই সময়ে কোনো পণ্যের বিক্রয় তথ্য নেই।
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topProducts.map((item, idx) => {
                const prod = productMap.get(item.id);
                return (
                  <div
                    key={item.id + idx}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-center font-extrabold text-slate-400 tabular-nums shrink-0">
                        {toBn(idx + 1)}
                      </span>
                      <img
                        src={getValidImageSrc(item.image)}
                        alt={item.name}
                        onError={handleImageError}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                          বিক্রয়: {toBn(item.qty)} পিস/প্যাক
                          {prod !== undefined ? ` · মজুদ: ${toBn(prod.stock)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-extrabold text-slate-900 font-mono tabular-nums shrink-0">
                      {formatMoney(item.revenue)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 5 Delivery Districts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-[#0D4A2E]" />
              <span>শীর্ষ ডেলিভারি জেলাসমূহ</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold tabular-nums">
              মোট {toBn(topDistricts.length)}টি প্রধান এলাকা
            </span>
          </div>

          {topDistricts.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-medium">
              জেলাভিত্তিক অর্ডার তথ্য এখনো নেই।
            </p>
          ) : (
            <div className="space-y-3.5">
              {topDistricts.map((d) => (
                <div key={d.district} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{d.district}</span>
                    <span className="text-slate-600 font-semibold tabular-nums font-mono">
                      {toBn(d.count)}টি ({toBn(d.pct)}%) · {formatMoney(d.revenue)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${d.pct}%` }}
                      className="h-full bg-[#0D4A2E] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Operational Lists: Stock Alert + Waiting Requests & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Out / Low Stock Warning with Waiting Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
              স্টক এলার্ট ও গ্রাহক চাহিদা
            </h3>
            <button
              type="button"
              onClick={() =>
                navigateTo({ tab: 'products', productView: 'categories', stockMode: 'low' })
              }
              className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              স্টক আপডেট করুন
            </button>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-72 pr-1">
            {stockAlertsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center font-medium">
                সব পণ্যের পর্যাপ্ত স্টক রয়েছে।
              </p>
            ) : (
              stockAlertsList.map((p) => {
                const reqCount = requestCountByProduct.get(p.id) || 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 text-xs py-2.5"
                  >
                    <div className="flex gap-2.5 items-center min-w-0">
                      <img
                        src={getValidImageSrc(p.image)}
                        onError={handleImageError}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 truncate">{p.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                          {p.category}
                          {reqCount > 0 && (
                            <span className="text-orange-700 font-bold">
                              {' '}
                              · অপেক্ষমাণ চাহিদা: {toBn(reqCount)} জন
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-extrabold tabular-nums px-2 py-1 rounded-md text-[11px] shrink-0 ${
                        p.stock <= 0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {p.stock <= 0 ? 'স্টক শেষ' : `বাকি: ${toBn(p.stock)}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
              সাম্প্রতিক অর্ডারসমূহ
            </h3>
            <button
              type="button"
              onClick={() => navigateTo({ tab: 'orders', orderStatus: 'all' })}
              className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              সব দেখুন
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center font-medium">
                কোনো অর্ডার প্লেস করা হয়নি এখনও।
              </p>
            ) : (
              orders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between text-xs py-2.5 gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">
                      {order.customerName}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5 truncate">
                      {order.customerPhone} · #{order.id} ·{' '}
                      {order.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {canViewFinancials && (
                    <p className="font-extrabold text-slate-900 font-mono tabular-nums">
                      {formatMoney(order.totalAmount)}
                    </p>
                    )}
                    <span
                      className={`text-[10px] font-bold inline-block mt-0.5 ${
                        order.status === 'pending'
                          ? 'text-amber-700'
                          : order.status === 'delivered'
                          ? 'text-emerald-700'
                          : order.status === 'cancelled'
                          ? 'text-rose-600'
                          : 'text-indigo-700'
                      }`}
                    >
                      {order.status === 'pending'
                        ? 'অপেক্ষমাণ'
                        : order.status === 'processing'
                        ? 'প্রসেসিং'
                        : order.status === 'shipped'
                        ? 'শিপড্'
                        : order.status === 'delivered'
                        ? 'ডেলিভার্ড'
                        : 'বাতিল'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
