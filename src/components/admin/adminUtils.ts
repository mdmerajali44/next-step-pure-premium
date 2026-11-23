import { Order, Product, ExpenseCategory } from '../../types';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const EN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toBn(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '০';
  return num.toString().replace(/\d/g, (d) => BN_DIGITS[parseInt(d, 10)] ?? d);
}

export function formatMoney(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  return `৳${rounded.toLocaleString('en-IN')}`;
}

export function normalizePhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  let str = String(phone).trim();
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(BN_DIGITS[i], 'g'), EN_DIGITS[i]);
  }
  str = str.replace(/[^\d]/g, '');
  if (str.startsWith('880') && str.length >= 13) {
    str = '0' + str.slice(3);
  }
  return str;
}

const BN_MONTH_INDEX: Record<string, number> = {
  'জানুয়ারী': 0, 'জানুয়ারি': 0, 'জানুয়ারী': 0, 'jan': 0, 'january': 0,
  'ফেব্রুয়ারী': 1, 'ফেব্রুয়ারি': 1, 'ফেব্রুয়ারী': 1, 'feb': 1, 'february': 1,
  'মার্চ': 2, 'mar': 2, 'march': 2,
  'এপ্রিল': 3, 'apr': 3, 'april': 3,
  'মে': 4, 'may': 4,
  'জুন': 5, 'jun': 5, 'june': 5,
  'জুলাই': 6, 'jul': 6, 'july': 6,
  'আগস্ট': 7, 'আগষ্ট': 7, 'aug': 7, 'august': 7,
  'সেপ্টেম্বর': 8, 'সেপ্টেম্বার': 8, 'sep': 8, 'september': 8,
  'অক্টোবর': 9, 'অক্টোবার': 9, 'oct': 9, 'october': 9,
  'নভেম্বর': 10, 'নভেম্বার': 10, 'nov': 10, 'november': 10,
  'ডিসেম্বর': 11, 'ডিসেম্বার': 11, 'dec': 11, 'december': 11,
};

export function parseFlexibleDate(dateVal: string | Date | undefined | null): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  let normalized = String(dateVal).trim();
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(BN_DIGITS[i], 'g'), EN_DIGITS[i]);
  }

  // Standard ISO or YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
    const parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const direct = new Date(normalized);
  if (!isNaN(direct.getTime())) {
    return direct;
  }

  // Handle DD/MM/YYYY or D/M/YYYY
  const slashMatch = normalized.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (slashMatch) {
    const d = parseInt(slashMatch[1], 10);
    const m = parseInt(slashMatch[2], 10) - 1;
    const y = parseInt(slashMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }

  // Handle Bengali formatted date like "28 জুন, 2026"
  const cleanTokens = normalized.replace(/,/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  if (cleanTokens.length >= 3) {
    const day = parseInt(cleanTokens[0], 10);
    const monthKey = cleanTokens[1].toLowerCase();
    const year = parseInt(cleanTokens[2], 10);
    const monthIdx = BN_MONTH_INDEX[monthKey];
    if (!isNaN(day) && !isNaN(year) && monthIdx !== undefined) {
      return new Date(year, monthIdx, day);
    }
  }

  return null;
}

export function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateOrderCogs(order: Order, productMap: Map<string, Product>): number {
  return order.items.reduce((sum, item) => {
    const prod = productMap.get(item.productId);
    const unitCost = prod?.purchasePrice && prod.purchasePrice > 0
      ? prod.purchasePrice
      : Math.round(item.price * 0.72); // Sensible wholesale fallback only when purchasePrice isn't set
    return sum + unitCost * item.quantity;
  }, 0);
}

export function hasExactPurchaseCost(order: Order, productMap: Map<string, Product>): boolean {
  return order.items.every((item) => {
    const prod = productMap.get(item.productId);
    return Boolean(prod?.purchasePrice && prod.purchasePrice > 0);
  });
}

export interface CustomerOrderMetrics {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  totalSpent: number;
  sameDayCount: number;
}

export function buildCustomerStatsMap(orders: Order[]): Map<string, CustomerOrderMetrics> {
  const map = new Map<string, CustomerOrderMetrics>();
  const dayCounts = new Map<string, Set<string>>();

  orders.forEach((order) => {
    const phone = normalizePhoneNumber(order.customerPhone);
    if (!phone) return;
    const prev = map.get(phone) || {
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
      totalSpent: 0,
      sameDayCount: 0,
    };
    prev.totalOrders += 1;
    if (order.status === 'delivered') prev.deliveredOrders += 1;
    if (order.status === 'cancelled') prev.cancelledOrders += 1;
    if (order.status === 'pending') prev.pendingOrders += 1;
    if (order.status !== 'cancelled') prev.totalSpent += order.totalAmount || 0;

    const dt = parseFlexibleDate(order.createdAt);
    if (dt) {
      const key = `${phone}__${getDateKey(dt)}`;
      const set = dayCounts.get(key) || new Set<string>();
      set.add(order.id);
      dayCounts.set(key, set);
      if (set.size > prev.sameDayCount) {
        prev.sameDayCount = set.size;
      }
    }

    map.set(phone, prev);
  });

  return map;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  purchase: 'পণ্য ক্রয় / সোর্সিং',
  packaging: 'প্যাকেজিং ও কন্টেইনার',
  courier: 'কুরিয়ার ও পরিবহণ',
  marketing: 'মার্কেটিং ও বিজ্ঞাপন',
  salary: 'কর্মচারী ও অফিস খরচ',
  other: 'অন্যান্য খরচ',
};

export function downloadCsvFile(filename: string, headers: string[], rows: (string | number | undefined | null)[][]): void {
  const escapeCell = (val: string | number | undefined | null) => {
    const str = val === undefined || val === null ? '' : String(val);
    const sanitized = str.replace(/"/g, '""');
    return `"${sanitized}"`;
  };
  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ];
  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
