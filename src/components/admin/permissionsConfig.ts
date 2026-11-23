import { User } from '../../types';

export interface PermissionOption {
  optionId: string;
  id: string; // `${sectionId}:${optionId}`
  name: string;
}

export interface PermissionSection {
  id: string;
  name: string;
  desc: string;
  options: PermissionOption[];
}

export const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    id: 'overview',
    name: 'ড্যাশবোর্ড ওভারভিউ',
    desc: 'আয়, লাভ-ক্ষতির হিসাব, চার্ট এবং ড্যাশবোর্ড সারসংক্ষেপ দেখার এক্সেস।',
    options: [
      { id: 'overview:financials', optionId: 'financials', name: 'আয়, ক্যাশ ও নিট লাভের হিসাব' },
      { id: 'overview:analytics', optionId: 'analytics', name: 'বিক্রয় চার্ট, অ্যালার্ট ও সাম্প্রতিক অর্ডার' },
    ],
  },
  {
    id: 'products',
    name: 'পণ্য ব্যবস্থাপনা',
    desc: 'পণ্য তালিকা, নতুন পণ্য যোগ, এডিট, ক্যাটাগরি ও স্টক এবং ডিলিট নিয়ন্ত্রণ।',
    options: [
      { id: 'products:list', optionId: 'list', name: 'সকল পণ্য তালিকা দেখা' },
      { id: 'products:add', optionId: 'add', name: 'নতুন পণ্য যোগ করা' },
      { id: 'products:edit', optionId: 'edit', name: 'পণ্য এডিট ও স্ট্যাটাস পরিবর্তন' },
      { id: 'products:categories', optionId: 'categories', name: 'ক্যাটাগরি ও স্টক ম্যানেজমেন্ট' },
      { id: 'products:delete', optionId: 'delete', name: 'পণ্য ও ক্যাটাগরি ডিলিট করা' },
    ],
  },
  {
    id: 'orders',
    name: 'অর্ডারসমূহ',
    desc: 'অর্ডার তালিকা, স্ট্যাটাস ফিল্টার, ম্যানুয়াল অর্ডার তৈরি, এডিট ও ডিলিট।',
    options: [
      { id: 'orders:all', optionId: 'all', name: 'সকল অর্ডার তালিকা' },
      { id: 'orders:pending', optionId: 'pending', name: 'অপেক্ষমাণ (Pending) অর্ডার' },
      { id: 'orders:processing', optionId: 'processing', name: 'প্রসেসিং অর্ডার' },
      { id: 'orders:delivered', optionId: 'delivered', name: 'ডেলিভার্ড অর্ডার' },
      { id: 'orders:create', optionId: 'create', name: 'নতুন মেমো / ম্যানুয়াল অর্ডার' },
      { id: 'orders:edit', optionId: 'edit', name: 'অর্ডার এডিট ও স্ট্যাটাস পরিবর্তন' },
      { id: 'orders:delete', optionId: 'delete', name: 'অর্ডার ডিলিট করার অনুমতি' },
    ],
  },
  {
    id: 'complaints',
    name: 'গ্রাহক সেবা ও অভিযোগ',
    desc: 'অভিযোগ তালিকা, ফলো-আপ, সমাধান এবং নতুন অভিযোগ নথিভুক্ত করা।',
    options: [
      { id: 'complaints:all', optionId: 'all', name: 'সকল অভিযোগ ও কল লগ' },
      { id: 'complaints:pending', optionId: 'pending', name: 'অপেক্ষমাণ অভিযোগ' },
      { id: 'complaints:in_progress', optionId: 'in_progress', name: 'চলমান ও কল ফলো-আপ' },
      { id: 'complaints:resolved', optionId: 'resolved', name: 'সমাধানকৃত অভিযোগ' },
      { id: 'complaints:create', optionId: 'create', name: 'নতুন অভিযোগ নথিভুক্ত করা' },
      { id: 'complaints:delete', optionId: 'delete', name: 'অভিযোগ ডিলিট করার অনুমতি' },
    ],
  },
  {
    id: 'payments',
    name: 'পেমেন্ট ও হিসাবরক্ষণ',
    desc: 'ট্রানজেকশন যাচাই, ব্যয় ও নিট লাভ এবং মাসিক রিপোর্ট ও CSV।',
    options: [
      { id: 'payments:all', optionId: 'all', name: 'সকল পেমেন্ট ও ট্রানজেকশন' },
      { id: 'payments:pending', optionId: 'pending', name: 'যাচাইয়ের অপেক্ষায় (Pending)' },
      { id: 'payments:approved', optionId: 'approved', name: 'অনুমোদিত পেমেন্ট' },
      { id: 'payments:cancelled', optionId: 'cancelled', name: 'বাতিলকৃত ট্রানজেকশন' },
      { id: 'payments:expenses', optionId: 'expenses', name: 'খরচ ও নিট লাভ (Expenses)' },
      { id: 'payments:reports', optionId: 'reports', name: 'রিপোর্ট ও CSV এক্সপোর্ট' },
    ],
  },
  {
    id: 'marketing',
    name: 'মার্কেটিং ও থিম',
    desc: 'ব্যানার, ঘোষণা, কুপন, অফার পপআপ, FAQ ও শিপিং কাস্টমাইজেশন।',
    options: [
      { id: 'marketing:brand_banners', optionId: 'brand_banners', name: '১. ব্র্যান্ড ও ব্যানার' },
      { id: 'marketing:ticker_categories', optionId: 'ticker_categories', name: '২. ঘোষণা ও ক্যাটাগরি' },
      { id: 'marketing:about_page', optionId: 'about_page', name: '৩. আমাদের সম্পর্কে' },
      { id: 'marketing:contact_info', optionId: 'contact_info', name: '৪. যোগাযোগ ও ম্যাপ' },
      { id: 'marketing:policies', optionId: 'policies', name: '৫. পলিসি ও শর্তাবলী' },
      { id: 'marketing:coupons', optionId: 'coupons', name: '৬. কুপন ম্যানেজমেন্ট' },
      { id: 'marketing:promo_offer', optionId: 'promo_offer', name: '৭. অফার পপআপ' },
      { id: 'marketing:faq', optionId: 'faq', name: '৮. এফএকিউ (FAQ)' },
      { id: 'marketing:shipping_delivery', optionId: 'shipping_delivery', name: '৯. শিপিং ও ডেলিভারি' },
    ],
  },
  {
    id: 'requests',
    name: 'প্রোডাক্ট রিকুয়েস্ট',
    desc: 'স্টক-আউট পণ্যের গ্রাহক অনুরোধ দেখা, স্ট্যাটাস আপডেট ও ডিলিট।',
    options: [
      { id: 'requests:all', optionId: 'all', name: 'সকল রিকুয়েস্ট তালিকা' },
      { id: 'requests:pending', optionId: 'pending', name: 'অপেক্ষমাণ রিকুয়েস্ট' },
      { id: 'requests:completed', optionId: 'completed', name: 'সম্পন্ন রিকুয়েস্ট' },
      { id: 'requests:delete', optionId: 'delete', name: 'রিকুয়েস্ট ডিলিট করার অনুমতি' },
    ],
  },
  {
    id: 'users',
    name: 'ইউজার ও সিকিউরিটি',
    desc: 'গ্রাহক তালিকা, অ্যাডমিন পারমিশন কন্ট্রোল, নিরাপত্তা লগ ও অ্যাকাউন্ট তৈরি।',
    options: [
      { id: 'users:all', optionId: 'all', name: 'সকল গ্রাহক ও ইউজার তালিকা' },
      { id: 'users:admin', optionId: 'admin', name: 'অ্যাডমিন ও পারমিশন কন্ট্রোল' },
      { id: 'users:security', optionId: 'security', name: 'নিরাপত্তা ও অডিট লগ' },
      { id: 'users:create', optionId: 'create', name: 'নতুন ইউজার/অ্যাডমিন যোগ' },
      { id: 'users:delete', optionId: 'delete', name: 'ইউজার ডিলিট করার অনুমতি' },
    ],
  },
  {
    id: 'sellers',
    name: 'উদ্যোক্তা (Multi-Vendor)',
    desc: 'ভেন্ডর আবেদন, উদ্যোক্তার পণ্য অনুমোদন, টাকা উত্তোলন ও সেটিংস।',
    options: [
      { id: 'sellers:applications', optionId: 'applications', name: 'ভেন্ডর আবেদন ও তালিকা' },
      { id: 'sellers:products', optionId: 'products', name: 'উদ্যোক্তার পণ্য অনুমোদন' },
      { id: 'sellers:withdraws', optionId: 'withdraws', name: 'টাকা উত্তোলন রিকোয়েস্ট' },
      { id: 'sellers:settings', optionId: 'settings', name: 'সেলার সিস্টেম সেটিংস' },
    ],
  },
  {
    id: 'reviews',
    name: 'রেটিং ও রিভিউ কন্ট্রোল',
    desc: 'কাস্টমার রিভিউ তালিকা, হাইড করা, নতুন রিভিউ যোগ ও ডিলিট।',
    options: [
      { id: 'reviews:all', optionId: 'all', name: 'সকল রিভিউ তালিকা' },
      { id: 'reviews:hidden', optionId: 'hidden', name: 'লুকানো (Hidden) রিভিউ' },
      { id: 'reviews:add', optionId: 'add', name: 'নতুন রিভিউ যোগ করা' },
      { id: 'reviews:delete', optionId: 'delete', name: 'রিভিউ ডিলিট করার অনুমতি' },
    ],
  },
];

export const getDefaultAllPermissions = (): string[] => {
  const result: string[] = [];
  PERMISSION_SECTIONS.forEach((sec) => {
    result.push(sec.id);
    sec.options.forEach((opt) => result.push(opt.id));
  });
  return result;
};

/**
 * Normalizes a legacy permissions array (which may only contain section IDs like ['products', 'orders'])
 * by expanding any section ID without explicit `sectionId:*` sub-keys to include all its options.
 */
export const normalizePermissionsForEditor = (perms?: string[] | null): string[] => {
  if (!perms) return getDefaultAllPermissions();
  const next = new Set<string>();
  PERMISSION_SECTIONS.forEach((sec) => {
    const hasGranular = perms.some((p) => p.startsWith(sec.id + ':'));
    if (hasGranular) {
      const enabledOpts = sec.options.filter((opt) => perms.includes(opt.id));
      if (enabledOpts.length > 0) {
        next.add(sec.id);
        enabledOpts.forEach((opt) => next.add(opt.id));
      }
    } else if (perms.includes(sec.id)) {
      next.add(sec.id);
      sec.options.forEach((opt) => next.add(opt.id));
    }
  });
  return Array.from(next);
};

export const isUserSuperAdmin = (user?: User | null): boolean => {
  if (!user) return false;
  return (
    user.phone === '01837587551' ||
    user.id === 'U-130163' ||
    (user.role === 'admin' && (user.name === 'মেহেদী হাসান' || user.phone === '01837587551'))
  );
};

export const checkHasSectionPermission = (user: User | null | undefined, sectionId: string): boolean => {
  if (!user) return true;
  if (user.role !== 'admin') return false;
  if (isUserSuperAdmin(user)) return true;
  if (!user.permissions) return true;
  return user.permissions.includes(sectionId) || user.permissions.some((p) => p.startsWith(sectionId + ':'));
};

export const checkHasOptionPermission = (
  user: User | null | undefined,
  sectionId: string,
  optionId: string
): boolean => {
  if (!user) return true;
  if (user.role !== 'admin') return false;
  if (isUserSuperAdmin(user)) return true;
  if (!user.permissions) return true;

  if (!checkHasSectionPermission(user, sectionId)) return false;

  const granularKeys = user.permissions.filter((p) => p.startsWith(sectionId + ':'));
  if (granularKeys.length > 0) {
    return user.permissions.includes(`${sectionId}:${optionId}`);
  }
  // Legacy permission array containing sectionId without granular keys grants all options in that section
  return user.permissions.includes(sectionId);
};

export const getSectionOptionCounts = (
  perms: string[] | undefined | null,
  sectionId: string
): { enabled: number; total: number } => {
  const sec = PERMISSION_SECTIONS.find((s) => s.id === sectionId);
  if (!sec) return { enabled: 0, total: 0 };
  const total = sec.options.length;
  if (!perms) return { enabled: total, total };

  const granularKeys = perms.filter((p) => p.startsWith(sectionId + ':'));
  if (granularKeys.length > 0) {
    const enabled = sec.options.filter((o) => perms.includes(o.id)).length;
    return { enabled, total };
  }
  return perms.includes(sectionId) ? { enabled: total, total } : { enabled: 0, total };
};
