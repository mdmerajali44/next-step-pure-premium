import React, { useState, useEffect } from 'react';
import { Sliders, Palette, Users, MapPin, ShieldAlert, CreditCard, ImageIcon, HelpCircle, Upload, Volume2, Share2, Facebook, Instagram, Youtube, Plus, Trash2 } from 'lucide-react';
import { Category, Coupon, SiteConfig } from '../../types';

interface MarketingTabProps {
  siteConfig: SiteConfig;
  categories: Category[];
  onUpdateSiteConfig: (config: SiteConfig) => void;
  notify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenImageSelector: (target: string) => void;
  // If the parent updates imageSelectorTarget and provides the currently selected image value to us
  selectedImageFromGallery?: { target: string; url: string } | null;
  onClearSelectedImageFromGallery?: () => void;
}

const compressAndSetImage = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target?.result as string;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // We want to preserve reasonable resolution (e.g. max 1000px)
      // but dynamically scale down and adjust JPEG quality to get under 100 KB.
      let maxDimension = 1000;
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(event.target?.result as string);
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Let's do a loop to find the best quality/size trade-off
      let quality = 0.8;
      let resultBase64 = canvas.toDataURL('image/jpeg', quality);
      
      // Under 100 KB means binary size < 100,000 bytes.
      // Base64 string length * 0.75 is approx binary size in bytes.
      // So base64 length must be < 133,333.
      const TARGET_BASE64_LENGTH = 133000; 
      
      // If still too large, let's try reducing quality first
      if (resultBase64.length > TARGET_BASE64_LENGTH) {
        quality = 0.6;
        resultBase64 = canvas.toDataURL('image/jpeg', quality);
      }
      
      if (resultBase64.length > TARGET_BASE64_LENGTH) {
        quality = 0.4;
        resultBase64 = canvas.toDataURL('image/jpeg', quality);
      }

      if (resultBase64.length > TARGET_BASE64_LENGTH) {
        quality = 0.2;
        resultBase64 = canvas.toDataURL('image/jpeg', quality);
      }
      
      // If even quality 0.2 is too big, let's resize the canvas to be smaller (e.g., 600px max)
      if (resultBase64.length > TARGET_BASE64_LENGTH) {
        const scale = 0.6; // Scale down
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = Math.round(width * scale);
        smallCanvas.height = Math.round(height * scale);
        const smallCtx = smallCanvas.getContext('2d');
        if (smallCtx) {
          smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
          // Try quality 0.5 on smaller image
          resultBase64 = smallCanvas.toDataURL('image/jpeg', 0.5);
          
          if (resultBase64.length > TARGET_BASE64_LENGTH) {
            // Last fallback: quality 0.2 on smaller image
            resultBase64 = smallCanvas.toDataURL('image/jpeg', 0.2);
          }
        }
      }
      
      callback(resultBase64);
    };
  };
  reader.readAsDataURL(file);
};

export default function MarketingTab({
  siteConfig,
  categories,
  onUpdateSiteConfig,
  notify,
  onOpenImageSelector,
  selectedImageFromGallery,
  onClearSelectedImageFromGallery,
}: MarketingTabProps) {
  const [marketingSubTab, setMarketingSubTab] = useState<'brand_banners' | 'ticker_categories' | 'about_page' | 'contact_info' | 'policies' | 'coupons' | 'promo_offer' | 'faq'>('brand_banners');

  const [cfgPromoActive, setCfgPromoActive] = useState<boolean>(siteConfig?.promoActive ?? true);
  const [cfgPromoImage, setCfgPromoImage] = useState<string>(siteConfig?.promoImage || '');
  const [cfgPromoLink, setCfgPromoLink] = useState<string>(siteConfig?.promoLink || '');

  const [cfgStoreName, setCfgStoreName] = useState(siteConfig?.storeName || 'ম্যাংগো লাভার');
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
      promoImage: cfgPromoImage,
      promoLink: cfgPromoLink,
      faqItems: cfgFaqItems,
    });
    notify('অভিনন্দন! আপনার শপ কাস্টমাইজেশন সফলভাবে আপডেট করা হয়েছে।', 'success');
  };

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white p-4 rounded-2xl border border-gray-200">
        <h3 className="font-bold text-gray-800 text-sm md:text-base">মার্কেটিং ও ব্র্যান্ড কাস্টমাইজেশন</h3>
        <p className="text-xs text-gray-400">আপনার শপের নাম, লোগো, ডাবল হিরো ব্যানার এবং ঘোষণা নোটিশগুলো পরিবর্তন করুন</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Marketing & Theme Sub-Tabs Switcher */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          <button
            type="button"
            onClick={() => setMarketingSubTab('brand_banners')}
            className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
              marketingSubTab === 'brand_banners'
                ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>১. ব্র্যান্ড ও ব্যানার</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketingSubTab('ticker_categories')}
            className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
              marketingSubTab === 'ticker_categories'
                ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>২. ঘোষণা ও ক্যাটাগরি</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketingSubTab('about_page')}
            className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
              marketingSubTab === 'about_page'
                ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>৩. আমাদের সম্পর্কে</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketingSubTab('contact_info')}
            className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
              marketingSubTab === 'contact_info'
                ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>৪. যোগাযোগ ও ম্যাপ</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketingSubTab('policies')}
            className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
              marketingSubTab === 'policies'
                ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>৫. পলিসি ও শর্তাবলী</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketingSubTab('coupons')}
            className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
              marketingSubTab === 'coupons'
                ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>৬. কুপন ম্যানেজমেন্ট</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketingSubTab('promo_offer')}
            className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
              marketingSubTab === 'promo_offer'
                ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>৭. অফার পপআপ</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketingSubTab('faq')}
            className={`px-4 py-2.5 text-[11px] font-black tracking-tight rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
              marketingSubTab === 'faq'
                ? 'bg-[#006437] text-white shadow-md shadow-emerald-900/10'
                : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>৮. এফএকিউ (FAQ)</span>
          </button>
        </div>

        {marketingSubTab === 'brand_banners' && (
          <div className="space-y-6">
            {/* Card 1: Brand Profile */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-500" />
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
                    <label className="block text-xs font-bold text-gray-700 mb-1">우리 সম্পর্কে - প্রধান শিরোনাম (Title)</label>
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
                                  onClick={() => {
                                    const updatedCoupons = cfgCoupons.filter(c => c.code !== coupon.code);
                                    setCfgCoupons(updatedCoupons);
                                    onUpdateSiteConfig({
                                      ...siteConfig,
                                      coupons: updatedCoupons
                                    });
                                    notify(`"${coupon.code}" কুপনটি বাদ দিয়ে সেভ করা হয়েছে।`, 'info');
                                  }}
                                  className="p-1 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-md transition-all cursor-pointer border-0 bg-transparent"
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
                            onClick={() => {
                              if (confirm('আপনি কি নিশ্চিতভাবে এই প্রশ্ন ও উত্তরটি মুছে ফেলতে চান?')) {
                                setCfgFaqItems(cfgFaqItems.filter((_, fidx) => fidx !== idx));
                                notify('প্রশ্নটি তালিকা থেকে মুছে ফেলা হয়েছে।', 'info');
                              }
                            }}
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

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer border-0"
          >
            কাস্টমাইজেশন সেভ করুন
          </button>
        </div>
      </form>
    </div>
  );
}
