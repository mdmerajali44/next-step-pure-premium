import React, { useState, useEffect } from 'react';
import {
  Sliders, Palette, Users, MapPin, ShieldAlert, CreditCard, ImageIcon, HelpCircle,
  Upload, Volume2, Share2, Facebook, Instagram, Youtube, Plus, Trash2, Truck,
  Check, Sparkles, Eye, Save, X
} from 'lucide-react';
import { Category, Coupon, SiteConfig } from '../../types';
import { compressImageFile as compressAndSetImage } from '../../utils/storage';
import { getValidImageSrc, handleImageError } from '../../utils/imageUtils';
import DeleteConfirmModal from './DeleteConfirmModal';

export type MarketingSubTabId =
  | 'brand_banners'
  | 'ticker_categories'
  | 'about_page'
  | 'contact_info'
  | 'policies'
  | 'coupons'
  | 'promo_offer'
  | 'faq'
  | 'shipping_delivery';

export const MARKETING_SUB_TABS: {
  id: MarketingSubTabId;
  num: string;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'brand_banners', num: '১', label: 'ব্র্যান্ড ও ব্যানার', shortDesc: 'লোগো, নাম ও হিরো ব্যানার', icon: Sliders },
  { id: 'ticker_categories', num: '২', label: 'ঘোষণা ও ক্যাটাগরি', shortDesc: 'স্ক্রলিং নোটিশ ও ক্যাটাগরি', icon: Palette },
  { id: 'about_page', num: '৩', label: 'আমাদের সম্পর্কে', shortDesc: 'গল্প ও ওনার প্রোফাইল', icon: Users },
  { id: 'contact_info', num: '৪', label: 'যোগাযোগ ও ম্যাপ', shortDesc: 'ঠিকানা, ম্যাপ ও সোশ্যাল', icon: MapPin },
  { id: 'policies', num: '৫', label: 'পলিসি ও শর্তাবলী', shortDesc: 'রিফান্ড ও প্রাইভেসি নীতি', icon: ShieldAlert },
  { id: 'coupons', num: '৬', label: 'কুপন ম্যানেজমেন্ট', shortDesc: 'ডিসকাউন্ট ও প্রোমো কোড', icon: CreditCard },
  { id: 'promo_offer', num: '৭', label: 'অফার পপআপ', shortDesc: 'ওয়েলকাম অফার ব্যানার', icon: ImageIcon },
  { id: 'faq', num: '৮', label: 'এফএকিউ (FAQ)', shortDesc: 'সচরাচর প্রশ্ন ও উত্তর', icon: HelpCircle },
  { id: 'shipping_delivery', num: '৯', label: 'শিপিং ও ডেলিভারি', shortDesc: 'ডেলিভারি চার্জ ও গ্যারান্টি', icon: Truck },
];

interface MarketingTabProps {
  siteConfig: SiteConfig;
  categories: Category[];
  onUpdateSiteConfig: (config: SiteConfig) => void;
  notify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenImageSelector: (target: string) => void;
  selectedImageFromGallery?: { target: string; url: string } | null;
  onClearSelectedImageFromGallery?: () => void;
  initialSubTab?: MarketingSubTabId;
  onSubTabChange?: (tab: MarketingSubTabId) => void;
  hideModuleSwitcher?: boolean;
  allowedSubTabs?: MarketingSubTabId[];
}

export default function MarketingTab({
  siteConfig,
  categories,
  onUpdateSiteConfig,
  notify,
  onOpenImageSelector,
  selectedImageFromGallery,
  onClearSelectedImageFromGallery,
  initialSubTab,
  onSubTabChange,
  hideModuleSwitcher = false,
  allowedSubTabs,
}: MarketingTabProps) {
  const visibleMarketingTabs = allowedSubTabs
    ? MARKETING_SUB_TABS.filter((t) => allowedSubTabs.includes(t.id))
    : MARKETING_SUB_TABS;

  const [marketingSubTab, setMarketingSubTabState] = useState<MarketingSubTabId>(() => {
    if (initialSubTab && (!allowedSubTabs || allowedSubTabs.includes(initialSubTab))) {
      return initialSubTab;
    }
    return visibleMarketingTabs[0]?.id || 'brand_banners';
  });

  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [faqDeleteIndex, setFaqDeleteIndex] = useState<number | null>(null);

  const setMarketingSubTab = (tab: MarketingSubTabId) => {
    setMarketingSubTabState(tab);
    onSubTabChange?.(tab);
  };

  useEffect(() => {
    if (initialSubTab && (!allowedSubTabs || allowedSubTabs.includes(initialSubTab))) {
      setMarketingSubTabState(initialSubTab);
    } else if (visibleMarketingTabs.length > 0 && !visibleMarketingTabs.some((t) => t.id === marketingSubTab)) {
      setMarketingSubTabState(visibleMarketingTabs[0].id);
    }
  }, [initialSubTab, allowedSubTabs]);

  const [cfgDeliveryInside, setCfgDeliveryInside] = useState<number>(siteConfig?.deliveryChargeInsideDhaka ?? 60);
  const [cfgDeliveryOutside, setCfgDeliveryOutside] = useState<number>(siteConfig?.deliveryChargeOutsideDhaka ?? 120);
  const [cfgGuaranteeText, setCfgGuaranteeText] = useState<string>(siteConfig?.checkoutGuaranteeText || 'পণ্য হাতে পেয়ে চেক করে দেখে মূল্য পরিশোধ করুন। শতভাগ খাঁটি ও ফ্রেশ কোয়ালিটির সম্পূর্ণ নিশ্চয়তা!');

  const [cfgPromoActive, setCfgPromoActive] = useState<boolean>(siteConfig?.promoActive ?? true);
  const [cfgHeritageSideDesignActive, setCfgHeritageSideDesignActive] = useState<boolean>(siteConfig?.heritageSideDesignActive !== false);
  const [cfgPromoImage, setCfgPromoImage] = useState<string>(siteConfig?.promoImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80');
  const [cfgPromoLink, setCfgPromoLink] = useState<string>(siteConfig?.promoLink || '');

  const [cfgStoreName, setCfgStoreName] = useState(siteConfig?.storeName || 'সাতক্ষীরা প্রিমিয়াম');
  const [cfgStoreSlogan, setCfgStoreSlogan] = useState(siteConfig?.storeSlogan || 'Pure & Organic Food');
  const [cfgStoreLogo, setCfgStoreLogo] = useState(siteConfig?.storeLogo || '');
  const [cfgStoreNameImage, setCfgStoreNameImage] = useState(siteConfig?.storeNameImage || '');
  const [cfgStoreSloganImage, setCfgStoreSloganImage] = useState(siteConfig?.storeSloganImage || '');
  
  const [cfgLeftImage, setCfgLeftImage] = useState(siteConfig?.leftBannerImage || '');
  const [cfgLeftTitle, setCfgLeftTitle] = useState(siteConfig?.leftBannerTitle || '');
  const [cfgLeftSubtitle, setCfgLeftSubtitle] = useState(siteConfig?.leftBannerSubtitle || '');
  const [cfgLeftBtnText, setCfgLeftBtnText] = useState(siteConfig?.leftBannerBtnText || 'Shop Now');
  const [cfgLeftCategory, setCfgLeftCategory] = useState(siteConfig?.leftBannerCategory || 'ফ্রেশ আম');

  const [cfgRightImage, setCfgRightImage] = useState(siteConfig?.rightBannerImage || '');
  const [cfgRightTitle, setCfgRightTitle] = useState(siteConfig?.rightBannerTitle || '');
  const [cfgRightSubtitle, setCfgRightSubtitle] = useState(siteConfig?.rightBannerSubtitle || '');
  const [cfgRightBtnText, setCfgRightBtnText] = useState(siteConfig?.rightBannerBtnText || 'Shop Now');
  const [cfgRightTagline, setCfgRightTagline] = useState(siteConfig?.rightBannerTagline || '');
  const [cfgRightCategory, setCfgRightCategory] = useState(siteConfig?.rightBannerCategory || 'মধু');

  const [cfgTicker1, setCfgTicker1] = useState(siteConfig?.tickerItems?.[0] || '🚚 অগ্রীম ছাড়াই অর্ডার করতে পারবেন');
  const [cfgTicker2, setCfgTicker2] = useState(siteConfig?.tickerItems?.[1] || '🛡️ ডেলিভারির সময় প্রোডাক্ট দেখে নিতে পারবেন');
  const [cfgTicker3, setCfgTicker3] = useState(siteConfig?.tickerItems?.[2] || '🍯 সিজন ফ্রেশ সুন্দরবনের খাঁটি মধু চলে এসেছে');
  const [cfgTicker4, setCfgTicker4] = useState(siteConfig?.tickerItems?.[3] || '📦 সারাদেশে ৩ দিনে দ্রুত হোম ডেলিভারি সুবিধা');
  const [cfgTicker5, setCfgTicker5] = useState(siteConfig?.tickerItems?.[4] || '💯 শতভাগ ন্যাচারাল ও কেমিক্যালমুক্ত ফ্রেশ আম');
  const [cfgTicker6, setCfgTicker6] = useState(siteConfig?.tickerItems?.[5] || '📞 যেকোনো প্রয়োজনে সরাসরি কল করুন আমাদের হটলাইনে');

  const [cfgCategoryImages, setCfgCategoryImages] = useState<Record<string, string>>(siteConfig?.categoryImages || {});
  const [cfgCategoryBanners, setCfgCategoryBanners] = useState<Record<string, string>>(siteConfig?.categoryBanners || {});
  const [cfgCategoryNames, setCfgCategoryNames] = useState<Record<string, string>>(siteConfig?.categoryNames || {});

  const [cfgAboutTitle, setCfgAboutTitle] = useState(siteConfig?.aboutTitle || 'আমাদের সম্পর্কে?');
  const [cfgAboutSubtitle, setCfgAboutSubtitle] = useState(siteConfig?.aboutSubtitle || '');
  const [cfgAboutOwnerImage, setCfgAboutOwnerImage] = useState(siteConfig?.aboutOwnerImage || '');
  const [cfgAboutHighlightText, setCfgAboutHighlightText] = useState(siteConfig?.aboutHighlightText || '');
  const [cfgAboutParagraph1, setCfgAboutParagraph1] = useState(siteConfig?.aboutParagraph1 || '');
  const [cfgAboutParagraph2, setCfgAboutParagraph2] = useState(siteConfig?.aboutParagraph2 || '');
  const [cfgAboutParagraph3, setCfgAboutParagraph3] = useState(siteConfig?.aboutParagraph3 || '');
  
  const [cfgAboutFacebookLink, setCfgAboutFacebookLink] = useState(siteConfig?.aboutFacebookLink || 'https://facebook.com');
  const [cfgMessengerLink, setCfgMessengerLink] = useState(siteConfig?.messengerLink || '');
  const [cfgFacebookLink, setCfgFacebookLink] = useState(siteConfig?.facebookLink || 'https://facebook.com');
  const [cfgInstagramLink, setCfgInstagramLink] = useState(siteConfig?.instagramLink || 'https://instagram.com');
  const [cfgYoutubeLink, setCfgYoutubeLink] = useState(siteConfig?.youtubeLink || 'https://youtube.com');

  const [cfgContactOffice, setCfgContactOffice] = useState(siteConfig?.contactOffice || '');
  const [cfgContactPhone, setCfgContactPhone] = useState(siteConfig?.contactPhone || '');
  const [cfgContactEmail, setCfgContactEmail] = useState(siteConfig?.contactEmail || '');
  const [cfgGoogleMapUrl, setCfgGoogleMapUrl] = useState(siteConfig?.googleMapUrl || '');

  const [cfgRefundPolicyText, setCfgRefundPolicyText] = useState(siteConfig?.refundPolicyText || '');
  const [cfgPrivacyPolicyText, setCfgPrivacyPolicyText] = useState(siteConfig?.privacyPolicyText || '');

  const [cfgFaqItems, setCfgFaqItems] = useState<{ question: string; answer: string }[]>(siteConfig?.faqItems || []);
  const [cfgCoupons, setCfgCoupons] = useState<Coupon[]>(siteConfig?.coupons || []);

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'flat' | 'percentage'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<number | ''>('');
  const [newCouponLimitPerPhone, setNewCouponLimitPerPhone] = useState<string>('1');
  const [newCouponMaxTotalUsage, setNewCouponMaxTotalUsage] = useState<number | ''>('');
  const [newCouponRestrictedPhones, setNewCouponRestrictedPhones] = useState<string>('');

  // Handle incoming image from gallery selector in parent
  useEffect(() => {
    if (selectedImageFromGallery) {
      const { target, url } = selectedImageFromGallery;
      if (target === 'logo') setCfgStoreLogo(url);
      else if (target === 'storeNameImage') setCfgStoreNameImage(url);
      else if (target === 'storeSloganImage') setCfgStoreSloganImage(url);
      else if (target === 'leftBanner') setCfgLeftImage(url);
      else if (target === 'rightBanner') setCfgRightImage(url);
      else if (target === 'aboutOwner') setCfgAboutOwnerImage(url);
      else if (target === 'promo') setCfgPromoImage(url);
      else if (target.startsWith('category-')) {
        const slug = target.replace('category-', '');
        setCfgCategoryImages(prev => ({ ...prev, [slug]: url }));
      } else if (target.startsWith('catbanner-')) {
        const slug = target.replace('catbanner-', '');
        setCfgCategoryBanners(prev => ({ ...prev, [slug]: url }));
      }
      
      if (onClearSelectedImageFromGallery) {
        onClearSelectedImageFromGallery();
      }
    }
  }, [selectedImageFromGallery]);

  // Handle synchronization of siteConfig updates if edited elsewhere
  useEffect(() => {
    if (siteConfig) {
      setCfgCoupons(siteConfig.coupons || []);
      setCfgFaqItems(siteConfig.faqItems || []);
      setCfgPromoActive(siteConfig.promoActive ?? true);
      setCfgHeritageSideDesignActive(siteConfig.heritageSideDesignActive !== false);
      if (siteConfig.promoImage) setCfgPromoImage(siteConfig.promoImage);
      if (siteConfig.promoLink !== undefined) setCfgPromoLink(siteConfig.promoLink);
      if (siteConfig.deliveryChargeInsideDhaka !== undefined) setCfgDeliveryInside(siteConfig.deliveryChargeInsideDhaka);
      if (siteConfig.deliveryChargeOutsideDhaka !== undefined) setCfgDeliveryOutside(siteConfig.deliveryChargeOutsideDhaka);
      if (siteConfig.checkoutGuaranteeText !== undefined) setCfgGuaranteeText(siteConfig.checkoutGuaranteeText);
    }
  }, [siteConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteConfig({
      storeName: cfgStoreName,
      storeSlogan: cfgStoreSlogan,
      storeLogo: cfgStoreLogo,
      storeNameImage: cfgStoreNameImage,
      storeSloganImage: cfgStoreSloganImage,
      leftBannerImage: cfgLeftImage,
      leftBannerTitle: cfgLeftTitle,
      leftBannerSubtitle: cfgLeftSubtitle,
      leftBannerBtnText: cfgLeftBtnText,
      leftBannerCategory: cfgLeftCategory,
      rightBannerImage: cfgRightImage,
      rightBannerTitle: cfgRightTitle,
      rightBannerSubtitle: cfgRightSubtitle,
      rightBannerBtnText: cfgRightBtnText,
      rightBannerTagline: cfgRightTagline,
      rightBannerCategory: cfgRightCategory,
      tickerItems: [cfgTicker1, cfgTicker2, cfgTicker3, cfgTicker4, cfgTicker5, cfgTicker6],
      categoryImages: cfgCategoryImages,
      categoryBanners: cfgCategoryBanners,
      categoryNames: cfgCategoryNames,
      aboutTitle: cfgAboutTitle,
      aboutSubtitle: cfgAboutSubtitle,
      aboutOwnerImage: cfgAboutOwnerImage,
      aboutHighlightText: cfgAboutHighlightText,
      aboutParagraph1: cfgAboutParagraph1,
      aboutParagraph2: cfgAboutParagraph2,
      aboutParagraph3: cfgAboutParagraph3,
      aboutFacebookLink: cfgAboutFacebookLink,
      messengerLink: cfgMessengerLink,
      facebookLink: cfgFacebookLink,
      instagramLink: cfgInstagramLink,
      youtubeLink: cfgYoutubeLink,
      contactOffice: cfgContactOffice,
      contactPhone: cfgContactPhone,
      contactEmail: cfgContactEmail,
      googleMapUrl: cfgGoogleMapUrl,
      refundPolicyText: cfgRefundPolicyText,
      privacyPolicyText: cfgPrivacyPolicyText,
      coupons: cfgCoupons,
      promoActive: cfgPromoActive,
      heritageSideDesignActive: cfgHeritageSideDesignActive,
      promoImage: cfgPromoImage,
      promoLink: cfgPromoLink,
      faqItems: cfgFaqItems,
      deliveryChargeInsideDhaka: Number(cfgDeliveryInside) || 60,
      deliveryChargeOutsideDhaka: Number(cfgDeliveryOutside) || 120,
      checkoutGuaranteeText: cfgGuaranteeText,
    });
    notify('অভিনন্দন! আপনার শপ কাস্টমাইজেশন সফলভাবে আপডেট করা হয়েছে।', 'success');
  };

  const activeMeta = MARKETING_SUB_TABS.find(t => t.id === marketingSubTab) || MARKETING_SUB_TABS[0];

  return (
    <div className="space-y-6 text-left">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Executive Studio Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#004d2a] via-[#006437] to-emerald-700 p-5 md:p-6 text-white shadow-sm">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-20 -bottom-12 w-32 h-32 rounded-full bg-orange-400/10 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/95 p-1.5 shadow-md flex items-center justify-center shrink-0 border border-white/40">
                <img
                  src={getValidImageSrc(cfgStoreLogo)}
                  alt={cfgStoreName}
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base md:text-lg tracking-tight">
                    {hideModuleSwitcher ? `${activeMeta.num}. ${activeMeta.label}` : 'মার্কেটিং ও থিম স্টুডিও'}
                  </h3>
                  {!hideModuleSwitcher && (
                    <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                      {activeMeta.num}. {activeMeta.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                  {hideModuleSwitcher
                    ? activeMeta.shortDesc
                    : 'শপের ব্র্যান্ডিং, ব্যানার, কুপন, ডেলিভারি চার্জ ও সকল তথ্য এখান থেকে সুন্দরভাবে নিয়ন্ত্রণ করুন'}
                </p>
              </div>
            </div>
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 border border-orange-400/30"
            >
              <Save className="w-4 h-4" />
              <span>পরিবর্তন সেভ করুন</span>
            </button>
          </div>
        </div>

        {/* Sleek Segmented Cards Navigation for All 9 Sections (hidden when sidebar controls active module) */}
        {!hideModuleSwitcher && (
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>সেকশন নির্বাচন করুন (৯টি মডিউল)</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              বর্তমান: {activeMeta.num}. {activeMeta.label}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {visibleMarketingTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = marketingSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMarketingSubTab(tab.id)}
                  className={`group text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-[#006437] border-[#006437] text-white shadow-sm'
                      : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-emerald-50/60 hover:border-emerald-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-emerald-700 border border-slate-200/80 group-hover:border-emerald-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black truncate leading-tight">
                      {tab.num}. {tab.label}
                    </div>
                    <div
                      className={`text-[9px] truncate mt-0.5 font-semibold ${
                        isActive ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {tab.shortDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {marketingSubTab === 'brand_banners' && (
          <div className="space-y-6">
            {/* Live Brand Header Preview */}
            <div className="bg-gradient-to-br from-emerald-50/70 via-white to-orange-50/50 p-4 rounded-2xl border border-emerald-200/70 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  লাইভ ব্র্যান্ড হেডার প্রিভিউ (Live Storefront Header Preview)
                </span>
                <span className="text-[10px] font-bold text-slate-400">স্বয়ংক্রিয়ভাবে আপডেট হচ্ছে</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-3 flex items-center gap-3 shadow-3xs">
                <img
                  src={getValidImageSrc(cfgStoreLogo)}
                  alt={cfgStoreName}
                  className="w-11 h-11 rounded-xl object-contain border border-slate-100 bg-slate-50 p-0.5"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="min-w-0">
                  {cfgStoreNameImage ? (
                    <img src={cfgStoreNameImage} alt={cfgStoreName} className="h-6 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="font-black text-slate-900 text-base leading-tight truncate">{cfgStoreName || 'সাতক্ষীরা প্রিমিয়াম'}</div>
                  )}
                  {cfgStoreSloganImage ? (
                    <img src={cfgStoreSloganImage} alt={cfgStoreSlogan} className="h-3.5 object-contain mt-0.5" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-[11px] font-bold text-emerald-700 truncate">{cfgStoreSlogan || 'Pure & Organic Food'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Side Heritage Design ON/OFF Switch Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="font-bold text-gray-800 text-sm">ওয়েবসাইটের দুই পাশের ঐতিহ্যবাহী ডিজাইন (Side Heritage Design)</h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfgHeritageSideDesignActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                    {cfgHeritageSideDesignActive ? 'চালু আছে (ON)' : 'বন্ধ আছে (OFF)'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                  চালু রাখলে ওয়েবসাইটের দুই পাশে বাংলাদেশের ঐতিহ্য, সংস্কৃতি ও স্থাপনার হালকা ফোটা ফোটা জলছাপ ডিজাইন দেখাবে। বন্ধ করলে সাধারণ সাদা ব্যাকগ্রাউন্ড দেখাবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !cfgHeritageSideDesignActive;
                  setCfgHeritageSideDesignActive(nextVal);
                  onUpdateSiteConfig({ ...siteConfig, heritageSideDesignActive: nextVal });
                  notify(
                    nextVal
                      ? 'দুই পাশের ঐতিহ্যবাহী ডিজাইন চালু করা হয়েছে!'
                      : 'দুই পাশের ঐতিহ্যবাহী ডিজাইন বন্ধ করা হয়েছে!',
                    nextVal ? 'success' : 'info'
                  );
                }}
                aria-pressed={cfgHeritageSideDesignActive}
                className={`w-14 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 flex items-center ${
                  cfgHeritageSideDesignActive ? 'bg-[#006437]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full transition-transform shadow-xs ${
                    cfgHeritageSideDesignActive ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Card 1: Brand Profile */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Sliders className="w-3.5 h-3.5" />
                </span>
                ১. ব্র্যান্ড আইডেন্টিটি (Brand Identity)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">স্টোরের নাম (Store Name)</label>
                  <input
                    type="text"
                    required
                    value={cfgStoreName}
                    onChange={(e) => setCfgStoreName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">স্লোগান (Slogan)</label>
                  <input
                    type="text"
                    required
                    value={cfgStoreSlogan}
                    onChange={(e) => setCfgStoreSlogan(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">স্টোর লোগো URL (Logo Image URL)</label>
                      <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: বর্গাকার লোগো (যেমন 200×200 px) দেখতে সুন্দর লাগবে।</span>
                    </div>
                    <div className="flex gap-2">
                      <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>কম্পিউটার থেকে আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressAndSetImage(file, (base64) => {
                                setCfgStoreLogo(base64);
                              });
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => onOpenImageSelector('logo')}
                        className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 bg-transparent"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>গ্যালারি থেকে বেছে নিন</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      value={cfgStoreLogo}
                      onChange={(e) => setCfgStoreLogo(e.target.value)}
                      className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                    />
                    {cfgStoreLogo && (
                      <img src={cfgStoreLogo} className="w-10 h-10 object-cover rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                    )}
                  </div>
                </div>

                {/* Brand Name Image */}
                <div className="md:col-span-2 border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">ব্র্যান্ডের নাম ছবি (Brand Name Image URL) - ঐচ্ছিক</label>
                      <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: নামের ছবি দিলে সেটি টেক্সটের পরিবর্তে ব্যবহার হবে। আড়াআড়ি ও পিএনজি হওয়া ভালো (প্রস্তাবিত সাইজ: ৩০০×৮০ পিক্সেল বা এর কাছাকাছি)।</span>
                    </div>
                    <div className="flex gap-2">
                      <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>কম্পিউটার থেকে আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressAndSetImage(file, (base64) => {
                                setCfgStoreNameImage(base64);
                              });
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => onOpenImageSelector('storeNameImage')}
                        className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 bg-transparent"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>গ্যালারি থেকে বেছে নিন</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="ছবি লিংক বা আপলোড করুন..."
                      value={cfgStoreNameImage}
                      onChange={(e) => setCfgStoreNameImage(e.target.value)}
                      className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                    />
                    {cfgStoreNameImage && (
                      <img src={cfgStoreNameImage} className="h-10 object-contain border border-gray-200 bg-gray-50 p-1 rounded" referrerPolicy="no-referrer" />
                    )}
                  </div>
                </div>

                {/* Store Slogan Image */}
                <div className="md:col-span-2 border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">স্লোগান ছবি (Slogan Image URL) - ঐচ্ছিক</label>
                      <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: স্লোগানের ছবি দিলে সেটি টেক্সটের পরিবর্তে ব্যবহার হবে। আড়াআড়ি ও পিএনজি হওয়া ভালো (প্রস্তাবিত সাইজ: ২০০×৪০ পিক্সেল বা এর কাছাকাছি)।</span>
                    </div>
                    <div className="flex gap-2">
                      <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>কম্পিউটার থেকে আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressAndSetImage(file, (base64) => {
                                setCfgStoreSloganImage(base64);
                              });
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => onOpenImageSelector('storeSloganImage')}
                        className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 bg-transparent"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>গ্যালারি থেকে বেছে নিন</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="ছবি লিংক বা আপলোড করুন..."
                      value={cfgStoreSloganImage}
                      onChange={(e) => setCfgStoreSloganImage(e.target.value)}
                      className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                    />
                    {cfgStoreSloganImage && (
                      <img src={cfgStoreSloganImage} className="h-6 object-contain border border-gray-200 bg-gray-50 p-1 rounded" referrerPolicy="no-referrer" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Left Hero Banner */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                ২. হিরো ব্যানার - বাম পাশ (Left Hero Banner - Large)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">ব্যানার ছবি লিংক (Banner Image URL)</label>
                      <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: আড়াআড়ি ব্যানার ছবি (যেমন 1200×600 px বা 16:9 রেশিও) দেখতে সুন্দর লাগবে।</span>
                    </div>
                    <div className="flex gap-2">
                      <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>কম্পিউটার থেকে আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressAndSetImage(file, (base64) => {
                                setCfgLeftImage(base64);
                              });
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => onOpenImageSelector('leftBanner')}
                        className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 bg-transparent"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>গ্যালারি থেকে বেছে নিন</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      value={cfgLeftImage}
                      onChange={(e) => setCfgLeftImage(e.target.value)}
                      className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                    />
                    {cfgLeftImage && (
                      <img src={cfgLeftImage} className="w-14 h-9 object-cover rounded-md border border-gray-200" referrerPolicy="no-referrer" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ব্যানার টাইটেল (Title)</label>
                  <input
                    type="text"
                    required
                    value={cfgLeftTitle}
                    onChange={(e) => setCfgLeftTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ব্যানার সাবটাইটেল (Subtitle/Description)</label>
                  <input
                    type="text"
                    required
                    value={cfgLeftSubtitle}
                    onChange={(e) => setCfgLeftSubtitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">বাটন টেক্সট (Button Text)</label>
                  <input
                    type="text"
                    required
                    value={cfgLeftBtnText}
                    onChange={(e) => setCfgLeftBtnText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">বাটন লিঙ্ক ক্যাটাগরি (Target Category)</label>
                  <select
                    value={cfgLeftCategory}
                    onChange={(e) => setCfgLeftCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-700 bg-white"
                  >
                    <option value="all">সব পণ্য</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cfgCategoryNames[cat.slug] || cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 3: Right Hero Banner */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                ৩. হিরো ব্যানার - ডান পাশ (Right Hero Banner - Small)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">ব্যানার ছবি লিংক (Banner Image URL)</label>
                      <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: আড়াআড়ি ছোট ব্যানার ছবি (যেমন 800×600 px বা 4:3 / 16:9 রেশিও) দেখতে সুন্দর লাগবে।</span>
                    </div>
                    <div className="flex gap-2">
                      <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>কম্পিউটার থেকে আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressAndSetImage(file, (base64) => {
                                setCfgRightImage(base64);
                              });
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => onOpenImageSelector('rightBanner')}
                        className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 bg-transparent"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>গ্যালারি থেকে বেছে নিন</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      value={cfgRightImage}
                      onChange={(e) => setCfgRightImage(e.target.value)}
                      className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                    />
                    {cfgRightImage && (
                      <img src={cfgRightImage} className="w-14 h-9 object-cover rounded-md border border-gray-200" referrerPolicy="no-referrer" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ট্যাগলাইন (Tagline / Badge text)</label>
                  <input
                    type="text"
                    required
                    value={cfgRightTagline}
                    onChange={(e) => setCfgRightTagline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ব্যানার টাইটেল (Title)</label>
                  <input
                    type="text"
                    required
                    value={cfgRightTitle}
                    onChange={(e) => setCfgRightTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ব্যানার সাবটাইটেল (Subtitle/Description)</label>
                  <input
                    type="text"
                    required
                    value={cfgRightSubtitle}
                    onChange={(e) => setCfgRightSubtitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">বাটন টেক্সট (Button Text)</label>
                  <input
                    type="text"
                    required
                    value={cfgRightBtnText}
                    onChange={(e) => setCfgRightBtnText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">বাটন লিঙ্ক ক্যাটাগরি (Target Category)</label>
                  <select
                    value={cfgRightCategory}
                    onChange={(e) => setCfgRightCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-700 bg-white"
                  >
                    <option value="all">সব পণ্য</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cfgCategoryNames[cat.slug] || cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {marketingSubTab === 'ticker_categories' && (
          <div className="space-y-6">
            {/* Card 4: Announcement Bulletins */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-orange-500" />
                ৪. এনাউন্সমেন্ট নোটিশ বার (Announcement Ticker)
              </h4>
              <p className="text-xs text-gray-400 font-medium">এখানে ৪ থেকে ৬ টি আকর্ষণীয় নোটিশ বা অফার লিখে দিন যা পেজের উপরে অনবরত স্ক্রল করবে।</p>
              <div className="space-y-3">
                {[
                  { label: 'নোটিশ ১', val: cfgTicker1, set: setCfgTicker1 },
                  { label: 'নোটিশ ২', val: cfgTicker2, set: setCfgTicker2 },
                  { label: 'নোটিশ ৩', val: cfgTicker3, set: setCfgTicker3 },
                  { label: 'নোটিশ ৪', val: cfgTicker4, set: setCfgTicker4 },
                  { label: 'নোটিশ ৫', val: cfgTicker5, set: setCfgTicker5 },
                  { label: 'নোটিশ ৬', val: cfgTicker6, set: setCfgTicker6 },
                ].map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{item.label}</label>
                    <input
                      type="text"
                      required
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 5: Category Overrides */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-orange-500" />
                ৫. ক্যাটাগরি নাম ও ছবি কাস্টমাইজেশন (Category Custom Name & Icons/Images)
              </h4>
              <p className="text-xs text-gray-400 leading-normal font-medium">
                এখানে ক্যাটাগরি গুলোর জন্য কাস্টম নাম এবং ছবি সেট করতে পারেন। যদি কোন কাস্টম নাম দেওয়া থাকে, তবে শপের সব জায়গায় সেই ক্যাটাগরির নাম হিসেবে সেটি প্রদর্শিত হবে। <strong className="text-emerald-700">পরামর্শ: বর্গাকার আইকন বা লোগো ছবি (যেমন 200×200 px বা 1:1 রেশিও) ব্যবহার করলে সবচেয়ে পারফেক্ট দেখাবে।</strong>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="border border-gray-100 p-3.5 rounded-xl space-y-3 bg-slate-50/30">
                    <div className="flex justify-between items-center gap-2 flex-wrap pb-1.5 border-b border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-800">{cat.name}</span>
                        {cfgCategoryNames[cat.slug] && (
                          <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                            ({cfgCategoryNames[cat.slug]})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <label className="text-[10px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all border border-emerald-100">
                          <Upload className="w-3 h-3 text-emerald-600" />
                          <span>আপলোড</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                compressAndSetImage(file, (base64) => {
                                  setCfgCategoryImages(prev => ({ ...prev, [cat.slug]: base64 }));
                                });
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => onOpenImageSelector('category-' + cat.slug)}
                          className="text-[10px] text-orange-600 hover:text-orange-700 font-extrabold bg-orange-50 px-2 py-0.5 rounded-md cursor-pointer border border-orange-100 bg-transparent"
                        >
                          গ্যালারি
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-gray-500">ক্যাটাগরির কাস্টম নাম (Custom Name)</label>
                      <input
                        type="text"
                        placeholder={`ডিফল্ট: ${cat.name}`}
                        value={cfgCategoryNames[cat.slug] || ''}
                        onChange={(e) => {
                          setCfgCategoryNames(prev => ({ ...prev, [cat.slug]: e.target.value }));
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium bg-white focus:border-orange-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-gray-500">ক্যাটাগরি ছবি লিঙ্ক (Image Link)</label>
                      <div className="flex gap-2 items-center font-medium">
                        <input
                          type="text"
                          placeholder="যেমন: /src/assets/images/..."
                          value={cfgCategoryImages[cat.slug] || ''}
                          onChange={(e) => {
                            setCfgCategoryImages(prev => ({ ...prev, [cat.slug]: e.target.value }));
                          }}
                          className="flex-grow px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden bg-white focus:border-orange-400"
                        />
                        {cfgCategoryImages[cat.slug] ? (
                          <img src={cfgCategoryImages[cat.slug]} className="w-7 h-7 object-cover rounded-md border border-gray-200 shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-7 h-7 bg-gray-100 flex items-center justify-center rounded-md text-[9px] text-gray-400 font-bold border border-gray-100 shrink-0">Default</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-amber-50/40 border border-amber-100/70 p-2.5 rounded-xl">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider">সেকশন ব্যানার ছবি (Section Banner Image)</label>
                        <div className="flex gap-1.5">
                          <label className="text-[9px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded transition-all border border-emerald-100">
                            <Upload className="w-2.5 h-2.5 text-emerald-600" />
                            <span>আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressAndSetImage(file, (base64) => {
                                    setCfgCategoryBanners(prev => ({ ...prev, [cat.slug]: base64 }));
                                  });
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => onOpenImageSelector('catbanner-' + cat.slug)}
                            className="text-[9px] text-orange-600 hover:text-orange-700 font-extrabold bg-orange-50 px-1.5 py-0.5 rounded cursor-pointer border border-orange-100 bg-transparent"
                          >
                            গ্যালারি
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center font-medium">
                        <input
                          type="text"
                          placeholder="যেমন: /src/assets/images/..."
                          value={cfgCategoryBanners[cat.slug] || ''}
                          onChange={(e) => {
                            setCfgCategoryBanners(prev => ({ ...prev, [cat.slug]: e.target.value }));
                          }}
                          className="flex-grow px-2 py-1.5 text-xs rounded-lg border border-amber-200/60 focus:outline-hidden bg-white focus:border-amber-400 text-slate-700"
                        />
                        {cfgCategoryBanners[cat.slug] ? (
                          <img src={cfgCategoryBanners[cat.slug]} className="w-9 h-7 object-cover rounded-md border border-amber-200 shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-9 h-7 bg-amber-100/40 text-amber-600/70 flex items-center justify-center rounded-md text-[9px] font-black border border-amber-100/30 shrink-0">Default</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {marketingSubTab === 'about_page' && (
          <div className="space-y-6">
            {/* Card 6: About Us Customization */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-orange-500" />
                ৬. আমাদের সম্পর্কে পেজ কাস্টমাইজেশন (About Us Page Settings)
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">আমাদের সম্পর্কে - প্রধান শিরোনাম (Title)</label>
                    <input
                      type="text"
                      required
                      value={cfgAboutTitle}
                      onChange={(e) => setCfgAboutTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ফেইসবুক লিংক (Facebook Page Link)</label>
                    <input
                      type="text"
                      required
                      value={cfgAboutFacebookLink}
                      onChange={(e) => setCfgAboutFacebookLink(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">মেসেঞ্জার লিংক (Facebook Messenger Link)</label>
                    <input
                      type="text"
                      required
                      value={cfgMessengerLink}
                      onChange={(e) => setCfgMessengerLink(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                      placeholder="e.g. https://m.me/yourpage"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">উপ-শিরোনাম বা সংক্ষিপ্ত বিবরণ (Subtitle / Intro)</label>
                  <textarea
                    required
                    rows={3}
                    value={cfgAboutSubtitle}
                    onChange={(e) => setCfgAboutSubtitle(e.target.value)}
                    className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">প্রতিষ্ঠাতা / ওনারের ছবি বা ব্যানার ছবি (Owner Image URL)</label>
                      <span className="text-[10px] text-emerald-600 block font-medium">পরামর্শ: এই ছবিটি আমাদের সম্পর্কে পেজের ডানপাশে শোভা পাবে।</span>
                    </div>
                    <div className="flex gap-2">
                      <label className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md transition-all hover:bg-emerald-100 border border-emerald-100">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>কম্পিউটার থেকে আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressAndSetImage(file, (base64) => {
                                setCfgAboutOwnerImage(base64);
                              });
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => onOpenImageSelector('aboutOwner')}
                        className="text-[11px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 bg-transparent"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>গ্যালারি থেকে বেছে নিন</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      value={cfgAboutOwnerImage}
                      onChange={(e) => setCfgAboutOwnerImage(e.target.value)}
                      className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                    />
                    {cfgAboutOwnerImage && (
                      <img src={cfgAboutOwnerImage} className="w-14 h-9 object-cover rounded-md border border-gray-200" referrerPolicy="no-referrer" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">হাইলাইটেড প্যারাগ্রাফ (Highlighted Info/Intro Bullet)</label>
                  <input
                    type="text"
                    required
                    value={cfgAboutHighlightText}
                    onChange={(e) => setCfgAboutHighlightText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-semibold text-emerald-700 bg-white"
                  />
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-3">
                  <h5 className="text-xs font-bold text-slate-700">সংক্ষিপ্ত গল্প প্যারাগ্রাফসমূহ (Our Story Paragraphs):</h5>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">প্যারাগ্রাফ ১ (শৈশব ও অনুপ্রেরণা)</label>
                    <textarea
                      required
                      rows={4}
                      value={cfgAboutParagraph1}
                      onChange={(e) => setCfgAboutParagraph1(e.target.value)}
                      className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">প্যারাগ্রাফ ২ (চ্যালেঞ্জ ও উদ্যোগের শুরু)</label>
                    <textarea
                      required
                      rows={4}
                      value={cfgAboutParagraph2}
                      onChange={(e) => setCfgAboutParagraph2(e.target.value)}
                      className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">প্যারাগ্রাফ ৩ (সাফল্য ও বর্তমান অবস্থান)</label>
                    <textarea
                      required
                      rows={4}
                      value={cfgAboutParagraph3}
                      onChange={(e) => setCfgAboutParagraph3(e.target.value)}
                      className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {marketingSubTab === 'contact_info' && (
          <div className="space-y-6">
            {/* Card 7: Contact Information */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-500" />
                ৭. যোগাযোগের বিবরণী ও ঠিকানা (Contact Settings)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">অফিসের ঠিকানা (Office Address)</label>
                  <input
                    type="text"
                    required
                    value={cfgContactOffice}
                    onChange={(e) => setCfgContactOffice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ফোন নম্বর (Contact Phone)</label>
                  <input
                    type="text"
                    required
                    value={cfgContactPhone}
                    onChange={(e) => setCfgContactPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ইমেইল ঠিকানা (Contact Email)</label>
                  <input
                    type="text"
                    required
                    value={cfgContactEmail}
                    onChange={(e) => setCfgContactEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">গুগল ম্যাপ / ওপেনস্ট্রিটম্যাপ এমবেড লিংক (Map Embed URL - iframe src)</label>
                  <input
                    type="text"
                    value={cfgGoogleMapUrl}
                    onChange={(e) => setCfgGoogleMapUrl(e.target.value)}
                    placeholder="যেমন: https://www.google.com/maps/embed?pb=..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 mt-2 space-y-1.5 text-amber-900">
                    <span className="text-xs font-black block">📍 গুগল ম্যাপস থেকে সঠিক লিংক বের করার নিয়ম (Step-by-Step Guide):</span>
                    <ol className="text-[11px] list-decimal list-inside space-y-1 font-semibold leading-relaxed">
                      <li>গুগল ম্যাপস (<a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-950">maps.google.com</a>) এ আপনার ঠিকানা লিখে সার্চ করুন।</li>
                      <li>সেখানকার <span className="font-black">"Share" (শেয়ার)</span> বাটনে ক্লিক করুন।</li>
                      <li>পপ-আপ উইন্ডো থেকে <span className="font-black">"Embed a map" (মানচিত্র এম্বেড করুন)</span> ট্যাবটি সিলেক্ট করুন।</li>
                      <li>সেখানে থাকা <span className="font-black">"Copy HTML" (HTML কপি করুন)</span> বাটনে ক্লিক করুন।</li>
                      <li>কপি করা কোড থেকে শুধুমাত্র <code className="bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">src="..."</code> এর ভেতরের অংশটুকু (https://... দিয়ে শুরু হওয়া লিংকটি) কপি করে এই ইনপুট বক্সে বসিয়ে দিন।</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 7.5: Social Media Links */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-orange-500" />
                ৭.৫. সোশ্যাল মিডিয়া লিংক কাস্টমাইজেশন (Social Media Settings)
              </h4>
              <p className="text-xs text-gray-400 font-medium">এখানে আপনার সোশ্যাল মিডিয়া অ্যাকাউন্ট/পেজের লিংকগুলো বসিয়ে দিন, যা ওয়েবসাইটের নিচের অংশে (Footer) প্রদর্শিত হবে।</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    <span>ফেইসবুক লিংক (Facebook Link)</span>
                  </label>
                  <input
                    type="url"
                    value={cfgFacebookLink}
                    onChange={(e) => setCfgFacebookLink(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span>ইনস্টাগ্রাম লিংক (Instagram Link)</span>
                  </label>
                  <input
                    type="url"
                    value={cfgInstagramLink}
                    onChange={(e) => setCfgInstagramLink(e.target.value)}
                    placeholder="https://instagram.com/yourprofile"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-600" />
                    <span>ইউটিউব লিংক (YouTube Link)</span>
                  </label>
                  <input
                    type="url"
                    value={cfgYoutubeLink}
                    onChange={(e) => setCfgYoutubeLink(e.target.value)}
                    placeholder="https://youtube.com/c/yourchannel"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {marketingSubTab === 'policies' && (
          <div className="space-y-6">
            {/* Card 8: Policies */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-500" />
                ৮. পলিসি ও শর্তাবলী (Policies)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">রিফান্ড পলিসি (Refund Policy Text)</label>
                  <textarea
                    rows={8}
                    required
                    value={cfgRefundPolicyText}
                    onChange={(e) => setCfgRefundPolicyText(e.target.value)}
                    className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">প্রাইভেসি পলিসি (Privacy Policy Text)</label>
                  <textarea
                    rows={8}
                    required
                    value={cfgPrivacyPolicyText}
                    onChange={(e) => setCfgPrivacyPolicyText(e.target.value)}
                    className="w-full p-3 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {marketingSubTab === 'coupons' && (
          <div className="space-y-6">
            {/* Card 9: Coupon Management */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4 text-left">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                ৯. কুপন কোড ও ডিসকাউন্ট সেটিংস (Coupon & Discount Settings)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Add Coupon Form */}
                <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h5 className="font-bold text-gray-700 text-xs flex items-center gap-1.5 border-b pb-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    নতুন কুপন কোড তৈরি করুন
                  </h5>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">কুপন কোড (ইংরেজি বড় অক্ষরের করুন)</label>
                    <input
                      type="text"
                      placeholder="MANGO15"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">ডিসকাউন্ট টাইপ</label>
                      <select
                        value={newCouponType}
                        onChange={(e) => setNewCouponType(e.target.value as 'flat' | 'percentage')}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-700 bg-white"
                      >
                        <option value="percentage">শতাংশ (%)</option>
                        <option value="flat">ফ্ল্যাট টাকা (TK)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">ডিসকাউন্ট পরিমাণ</label>
                      <input
                        type="number"
                        placeholder={newCouponType === 'percentage' ? 'যেমন: 15' : 'যেমন: 150'}
                        value={newCouponValue}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setNewCouponValue(val);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">মোবাইল প্রতি ব্যবহার</label>
                      <select
                        value={newCouponLimitPerPhone}
                        onChange={(e) => setNewCouponLimitPerPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-gray-700 bg-white"
                      >
                        <option value="1">সর্বোচ্চ ১ বার</option>
                        <option value="0">সীমাহীন (Unlimited)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">মোট সর্বোচ্চ ব্যবহার (ঐচ্ছিক)</label>
                      <input
                        type="number"
                        placeholder="যেমন: ১০০"
                        value={newCouponMaxTotalUsage}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setNewCouponMaxTotalUsage(val);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">নির্দিষ্ট মোবাইল নম্বরসমূহ (ঐচ্ছিক - কমা দিয়ে একাধিক লিখতে পারেন)</label>
                    <input
                      type="text"
                      placeholder="যেমন: 01712345678, 01837587551"
                      value={newCouponRestrictedPhones}
                      onChange={(e) => setNewCouponRestrictedPhones(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                    />
                    <p className="text-[9px] text-gray-400 font-bold mt-0.5">খালি রাখলে যেকোনো মোবাইল নম্বর দিয়ে ব্যবহার করা যাবে।</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const code = newCouponCode.trim().toUpperCase();
                      if (!code) {
                        notify('অনুগ্রহ করে একটি কুপন কোড দিন!', 'error');
                        return;
                      }
                      if (newCouponValue === '' || newCouponValue <= 0) {
                        notify('অনুগ্রহ করে সঠিক ডিসকাউন্ট পরিমাণ দিন!', 'error');
                        return;
                      }
                      if (newCouponType === 'percentage' && newCouponValue > 100) {
                        notify('শতাংশ ডিসকাউন্ট ১০০% এর বেশি হতে পারবে না!', 'error');
                        return;
                      }
                      
                      if (cfgCoupons.some(c => c.code === code)) {
                        notify('এই কুপন কোডটি ইতিমধ্যেই আছে!', 'error');
                        return;
                      }

                      const newCoupon: Coupon = {
                        code,
                        type: newCouponType,
                        value: newCouponValue,
                        limitPerPhone: newCouponLimitPerPhone === '1' ? 1 : undefined,
                        maxTotalUsage: newCouponMaxTotalUsage !== '' ? Number(newCouponMaxTotalUsage) : undefined,
                        restrictedPhones: newCouponRestrictedPhones.trim() ? newCouponRestrictedPhones.trim() : undefined
                      };

                      const updatedCoupons = [...cfgCoupons, newCoupon];
                      setCfgCoupons(updatedCoupons);
                      onUpdateSiteConfig({
                        ...siteConfig,
                        coupons: updatedCoupons
                      });
                      
                      setNewCouponCode('');
                      setNewCouponValue('');
                      setNewCouponMaxTotalUsage('');
                      setNewCouponRestrictedPhones('');
                      notify(`নতুন কুপন "${code}" সফলভাবে যুক্ত ও সেভ করা হয়েছে!`, 'success');
                    }}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 border-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>কুপন কোড যুক্ত করুন</span>
                  </button>
                </div>

                {/* Existing Coupons list */}
                <div className="md:col-span-7 space-y-3">
                  <h5 className="font-bold text-gray-700 text-xs">বিদ্যমান কুপন সমূহের তালিকা ({cfgCoupons.length})</h5>
                  {cfgCoupons.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400 font-bold">কোনো সচল কুপন কোড পাওয়া যায়নি।</p>
                      <p className="text-[10px] text-slate-400 mt-1">বামদিকের ফর্মটি ব্যবহার করে নতুন কুপন যুক্ত করুন।</p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white max-h-[250px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2 text-[10px] font-black text-gray-500">কুপন কোড</th>
                            <th className="px-3 py-2 text-[10px] font-black text-gray-500">ধরন</th>
                            <th className="px-3 py-2 text-[10px] font-black text-gray-500">ছাড়ের পরিমাণ</th>
                            <th className="px-3 py-2 text-[10px] font-black text-gray-500">ব্যবহারের সীমা</th>
                            <th className="px-3 py-2 text-right px-4 text-[10px] font-black text-gray-500">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {cfgCoupons.map((coupon, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2.5 text-xs font-black text-emerald-800">{coupon.code}</td>
                              <td className="px-3 py-2.5 text-[11px] font-bold text-slate-600">
                                {coupon.type === 'percentage' ? 'শতকরা ছাড় (%)' : 'ফ্ল্যাট ছাড় (৳)'}
                              </td>
                              <td className="px-3 py-2.5 text-xs font-black text-slate-800">
                                {coupon.type === 'percentage' ? `${coupon.value}%` : `৳ ${coupon.value}`}
                              </td>
                              <td className="px-3 py-2.5 text-[10px] font-medium text-slate-700">
                                <div className="space-y-0.5 font-bold">
                                  <div>{coupon.limitPerPhone === 1 || coupon.limitPerPhone === '1' || coupon.limitPerPhone === true ? '📱 প্রতি নম্বরে ১ বার' : '📱 সীমাহীন'}</div>
                                  {coupon.maxTotalUsage ? <div>🎯 মোট সর্বোচ্চ {coupon.maxTotalUsage} বার</div> : null}
                                  {coupon.restrictedPhones ? (
                                    <div className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[9px] mt-1 font-extrabold flex items-center gap-1 w-max" title={coupon.restrictedPhones}>
                                      <span>🔒 শুধু:</span>
                                      <span className="truncate max-w-[100px]">{coupon.restrictedPhones}</span>
                                    </div>
                                  ) : (
                                    <div className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] mt-1 font-extrabold w-max">
                                      <span>🔓 সবার জন্য উন্মুক্ত</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right px-4">
                                <button
                                  type="button"
                                  onClick={() => setCouponToDelete(coupon)}
                                  className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-md transition-all cursor-pointer border-0 bg-transparent"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-2.5 text-[10px] text-amber-800 flex gap-1.5 leading-relaxed font-bold">
                    <span className="font-extrabold text-amber-700">💡 তথ্য:</span>
                    <span>গ্রাহকরা কার্টে বা চেকআউট পেজে কুপন কোডগুলো এপ্লাই করে ইনস্ট্যান্ট ডিসকাউন্ট সুবিধা উপভোগ করতে পারবেন। যেকোনো কুপন যুক্ত বা ডিলিট করার পর অবশ্যই নিচের <strong className="text-red-700">"কাস্টমাইজেশন সেভ করুন"</strong> বাটনে ক্লিক করবেন।</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {marketingSubTab === 'promo_offer' && (
          <div className="space-y-6">
            {/* Card 10: Promo Popup Management */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                ১০. বর্তমান স্পেশাল অফার পপআপ (Promo Offer Popup)
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed font-bold">
                ওয়েবসাইটে প্রবেশের সাথে সাথে গ্রাহকদের জন্য একটি আকর্ষণীয় ডিসকাউন্ট বা অফারের ছবি-সংবলিত পপআপ উইন্ডো প্রদর্শন করুন। গ্রাহক চাইলে এটি কেটে দিতে পারবেন।
              </p>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                <div className="md:col-span-7 space-y-5">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <label className="block text-xs font-black text-gray-700">পপআপ স্ট্যাটাস (Popup Status)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="radio"
                          name="promoActive"
                          checked={cfgPromoActive === true}
                          onChange={() => setCfgPromoActive(true)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-black">অফিসিয়ালি চালু (Show Popup)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="radio"
                          name="promoActive"
                          checked={cfgPromoActive === false}
                          onChange={() => setCfgPromoActive(false)}
                          className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                        />
                        <span className="text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-black">সাময়িকভাবে বন্ধ (Hide Popup)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-700 flex items-center justify-between">
                      <span>অফার ব্যানার ইমেজ (Offer Banner Image) *</span>
                      <span className="text-[11px] text-orange-600 font-extrabold bg-orange-50 px-2 py-0.5 rounded">সাইজ: 800x800 px (Square) সবচেয়ে ভালো দেখাবে</span>
                    </label>

                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="ছবির ডিরেক্ট লিংক (যেমন: https://...)"
                        value={cfgPromoImage}
                        onChange={(e) => setCfgPromoImage(e.target.value)}
                        className="flex-grow px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-medium text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => onOpenImageSelector('promo')}
                        className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0 border-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>গ্যালারি</span>
                      </button>
                    </div>

                    <div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-md cursor-pointer transition-colors border border-slate-200/50">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>সরাসরি কম্পিউটার/মোবাইল থেকে আপলোড করুন</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressAndSetImage(file, (base64) => {
                                setCfgPromoImage(base64);
                              });
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-1.5">
                        📌 <span className="text-orange-600 font-black">প্রস্তাবিত সাইজ:</span> স্কয়ার বা চারকোনা ছবির জন্য <span className="text-[#006437] font-extrabold">800 × 800 পিক্সেল (1:1)</span> ব্যবহার করুন। এতে মোবাইল ও কম্পিউটার দুই স্ক্রিনেই চমৎকার দেখাবে।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-col justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <h5 className="font-bold text-gray-700 text-xs mb-3 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                      <span>লাইভ প্রিভিউ (Popup Preview)</span>
                      {cfgPromoActive ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-md font-black">সচল</span>
                      ) : (
                        <span className="bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-md font-black">বন্ধ</span>
                      )}
                    </h5>

                    {cfgPromoImage ? (
                      <div className="relative max-w-[200px] mx-auto rounded-xl shadow-md border border-gray-200 bg-white overflow-hidden group">
                        <img
                          src={cfgPromoImage}
                          alt="Live Preview"
                          className="w-full h-auto object-contain rounded-xl max-h-[220px]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white text-[8px] font-black pointer-events-none">
                          ✕
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-[11px] text-gray-400 font-bold border border-dashed border-gray-300">
                        কোনো অফার ছবি সিলেক্ট করা নেই
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {marketingSubTab === 'faq' && (
          <div className="space-y-6">
            {/* Card FAQ Management */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-500" />
                ১১. সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ) ম্যানেজমেন্ট
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed font-bold">
                আপনার শপের কাস্টমারদের সাহায্য করার জন্য ঘন ঘন জিজ্ঞাসিত প্রশ্ন এবং তাদের উত্তরগুলো এখান থেকে সহজে সাজিয়ে নিন। পরিবর্তনের পর পেইজের নিচে থাকা "কাস্টমাইজেশন সেভ করুন" বাটনে ক্লিক করুন।
              </p>

              {/* Add New FAQ Section */}
              <div className="bg-emerald-50/30 p-4 md:p-5 rounded-2xl border border-emerald-100/60 space-y-3">
                <h5 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">+</span>
                  নতুন প্রশ্ন ও উত্তর যুক্ত করুন
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-emerald-900">প্রশ্ন (Question)</label>
                    <input
                      type="text"
                      id="new-faq-q"
                      placeholder="যেমন: আপনাদের ডেলিভারি চার্জ কত?"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden font-semibold text-slate-800 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-emerald-900">উত্তর (Answer)</label>
                    <textarea
                      id="new-faq-a"
                      rows={2}
                      placeholder="যেমন: সারা বাংলাদেশে আমাদের ডেলিভারি চার্জ মাত্র ৫০ টাকা।"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden font-semibold text-slate-800 bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const qInput = document.getElementById('new-faq-q') as HTMLInputElement;
                      const aInput = document.getElementById('new-faq-a') as HTMLTextAreaElement;
                      const q = qInput?.value?.trim();
                      const a = aInput?.value?.trim();
                      if (!q || !a) {
                        notify('দয়া করে প্রশ্ন ও উত্তর দুটোই লিখুন!', 'error');
                        return;
                      }
                      setCfgFaqItems([...cfgFaqItems, { question: q, answer: a }]);
                      if (qInput) qInput.value = '';
                      if (aInput) aInput.value = '';
                      notify('প্রশ্নটি তালিকায় যুক্ত করা হয়েছে!', 'success');
                    }}
                    className="bg-[#006437] hover:bg-emerald-800 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer border-0"
                  >
                    প্রশ্নটি তালিকায় যোগ করুন
                  </button>
                </div>
              </div>

              {/* Current FAQs List */}
              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-gray-700 text-xs flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                  <span>বর্তমানে সচল প্রশ্ন ও উত্তর সমূহ ({cfgFaqItems.length} টি)</span>
                </h5>

                {cfgFaqItems.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-bold">কোনো প্রশ্ন যুক্ত করা নেই। উপরের ফরম ব্যবহার করে প্রথম প্রশ্নটি যোগ করুন।</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {cfgFaqItems.map((faq, idx) => (
                      <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-grow">
                            <div className="flex items-start gap-2">
                              <span className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0.5 rounded-md font-black shrink-0 mt-0.5">প্রশ্ন {idx + 1}</span>
                              <input
                                type="text"
                                value={faq.question}
                                onChange={(e) => {
                                  const updated = [...cfgFaqItems];
                                  updated[idx].question = e.target.value;
                                  setCfgFaqItems(updated);
                                }}
                                className="w-full bg-white px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-bold text-slate-800"
                              />
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-md font-black shrink-0 mt-0.5">উত্তর {idx + 1}</span>
                              <textarea
                                rows={2}
                                value={faq.answer}
                                onChange={(e) => {
                                  const updated = [...cfgFaqItems];
                                  updated[idx].answer = e.target.value;
                                  setCfgFaqItems(updated);
                                }}
                                className="w-full bg-white px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden font-semibold text-slate-700"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFaqDeleteIndex(idx)}
                            className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer shrink-0 mt-1 border-0 bg-transparent"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {marketingSubTab === 'shipping_delivery' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-extrabold text-slate-800">ডেলিভারি চার্জ ও শিপিং সেটিংস</h4>
                  <p className="text-xs text-gray-400 font-medium">ঢাকা ও ঢাকার বাহিরের শিপিং চার্জ নির্ধারণ করুন এবং কুপন ফিল্ডের নিচের গ্যারান্টি লেখা কাস্টমাইজ করুন</p>
                </div>
              </div>

              {/* Delivery charges grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50/40 border border-orange-200/60 rounded-2xl space-y-2">
                  <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>🏢 ঢাকার ভিতরে ডেলিভারি চার্জ (টাকা):</span>
                    <span className="text-[10px] bg-orange-200/60 text-orange-900 px-1.5 py-0.2 rounded font-mono font-bold">Inside Dhaka</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={cfgDeliveryInside}
                      onChange={(e) => setCfgDeliveryInside(Number(e.target.value) || 0)}
                      placeholder="যেমন: ৬০"
                      className="w-full bg-white px-3.5 py-2.5 text-sm rounded-xl border border-orange-200 focus:outline-hidden focus:border-orange-500 font-mono font-black text-slate-900"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">৳</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">গ্রাহক ঢাকার ভেতরের ঠিকানা নির্বাচন করলে স্বয়ংক্রিয়ভাবে এই চার্জটি যুক্ত হবে।</p>
                </div>

                <div className="p-4 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl space-y-2">
                  <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>🚛 ঢাকার বাহিরে ডেলিভারি চার্জ (টাকা):</span>
                    <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">Outside Dhaka</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={cfgDeliveryOutside}
                      onChange={(e) => setCfgDeliveryOutside(Number(e.target.value) || 0)}
                      placeholder="যেমন: ১২০"
                      className="w-full bg-white px-3.5 py-2.5 text-sm rounded-xl border border-emerald-200 focus:outline-hidden focus:border-emerald-500 font-mono font-black text-slate-900"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">৳</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">গ্রাহক ঢাকার বাইরের কোনো জেলা নির্বাচন করলে স্বয়ংক্রিয়ভাবে এই চার্জটি লক হয়ে যাবে।</p>
                </div>
              </div>

              {/* Checkout Guarantee Text under Coupon */}
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2.5">
                <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <span>কুপনের নিচে সুন্দর বর্ডারসহ গ্যারান্টি নোটিশের লেখা:</span>
                </label>
                <textarea
                  rows={3}
                  value={cfgGuaranteeText}
                  onChange={(e) => setCfgGuaranteeText(e.target.value)}
                  placeholder="যেমন: পণ্য হাতে পেয়ে চেক করে দেখে মূল্য পরিশোধ করুন। শতভাগ খাঁটি ও ফ্রেশ কোয়ালিটির সম্পূর্ণ নিশ্চয়তা!"
                  className="w-full bg-white px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 font-semibold text-slate-800 resize-none leading-relaxed"
                />
                <p className="text-[11px] text-gray-500 font-medium">
                  এই লেখাটি চেকআউট ফর্মের কুপন কোড ফিল্ডের নিচে চারপাশে সুন্দর বর্ডার এবং আইকন সহকারে ফ্রেম আকারে প্রদর্শিত হবে।
                </p>

                {/* Live Guarantee Preview Box */}
                <div className="pt-1">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block mb-1.5">লাইভ চেকআউট প্রিভিউ:</span>
                  <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-300 rounded-xl p-3 flex items-start gap-2.5 text-emerald-900">
                    <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold leading-relaxed">{cfgGuaranteeText || 'আপনার গ্যারান্টি লেখা এখানে দেখাবে...'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Bottom Studio Save Bar */}
        <div className="sticky bottom-3 z-20 bg-white/95 backdrop-blur-md border border-emerald-200/80 rounded-2xl px-5 py-3.5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-slate-600">
              সক্রিয় মডিউল: <strong className="text-[#006437]">{activeMeta.num}. {activeMeta.label}</strong> — পরিবর্তন স্থায়ী করতে সেভ বাটনে ক্লিক করুন
            </span>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-[#006437] hover:bg-[#004d2a] active:scale-98 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer border-0 flex items-center justify-center gap-2 shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>কাস্টমাইজেশন সেভ করুন</span>
          </button>
        </div>
      </form>

      <DeleteConfirmModal
        isOpen={Boolean(couponToDelete)}
        title="কুপন কোড মুছে ফেলতে চান?"
        description={
          couponToDelete && (
            <>
              আপনি কি নিশ্চিতভাবে <strong className="text-slate-900 font-mono">"{couponToDelete.code}"</strong> কুপন কোডটি তালিকা থেকে ডিলিট করতে চান?
            </>
          )
        }
        onCancel={() => setCouponToDelete(null)}
        onConfirm={() => {
          if (!couponToDelete) return;
          const updatedCoupons = cfgCoupons.filter((c) => c.code !== couponToDelete.code);
          setCfgCoupons(updatedCoupons);
          onUpdateSiteConfig({
            ...siteConfig,
            coupons: updatedCoupons,
          });
          notify(`"${couponToDelete.code}" কুপনটি বাদ দিয়ে সেভ করা হয়েছে।`, 'info');
          setCouponToDelete(null);
        }}
      />

      <DeleteConfirmModal
        isOpen={faqDeleteIndex !== null}
        title="প্রশ্ন ও উত্তর মুছে ফেলতে চান?"
        description={
          faqDeleteIndex !== null && cfgFaqItems[faqDeleteIndex] ? (
            <>
              আপনি কি নিশ্চিতভাবে <strong className="text-slate-900">"{cfgFaqItems[faqDeleteIndex].question || `প্রশ্ন ${faqDeleteIndex + 1}`}"</strong> প্রশ্নটি মুছে ফেলতে চান?
            </>
          ) : null
        }
        onCancel={() => setFaqDeleteIndex(null)}
        onConfirm={() => {
          if (faqDeleteIndex === null) return;
          const updatedFaq = cfgFaqItems.filter((_, fidx) => fidx !== faqDeleteIndex);
          setCfgFaqItems(updatedFaq);
          onUpdateSiteConfig({
            ...siteConfig,
            faqItems: updatedFaq,
          });
          notify('প্রশ্নটি তালিকা থেকে মুছে ফেলা হয়েছে।', 'info');
          setFaqDeleteIndex(null);
        }}
      />
    </div>
  );
}
