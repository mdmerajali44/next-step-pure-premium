/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, SiteConfig } from '../types';
import { 
  X, Search, Truck, Phone, MapPin, Calendar, DollarSign, 
  CheckCircle, Clock, AlertCircle, ShoppingBag, MessageSquare, 
  ChevronRight, Copy, Check, ShieldCheck, Box, User, Receipt, CreditCard,
  AlertTriangle, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  siteConfig: SiteConfig;
  onAddComplaint?: (complaint: any) => Promise<any>;
}

export default function OrderTrackingModal({ isOpen, onClose, orders, siteConfig, onAddComplaint }: OrderTrackingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Complaint modal states
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState<'damage' | 'delay' | 'wrong_item' | 'quality' | 'price' | 'behavior' | 'other'>('damage');
  const [complaintPriority, setComplaintPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintSuccessNotice, setComplaintSuccessNotice] = useState<string | null>(null);
  const [complaintError, setComplaintError] = useState<string | null>(null);

  // Clear states when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearched(false);
      setMatchedOrders([]);
      setSelectedOrder(null);
      setError(null);
      setCopiedId(false);
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSelectedOrder(null);
    setMatchedOrders([]);
    setSearched(true);
    setCopiedId(false);

    const query = searchQuery.trim();
    if (!query) {
      setError('দয়া করে আপনার অর্ডার নম্বর অথবা মোবাইল নম্বরটি টাইপ করুন!');
      return;
    }

    // Determine search type: phone or order ID
    const isPhone = /^[0-9+]+$/.test(query);

    if (isPhone) {
      const cleanQuery = query.replace(/[^0-9]/g, '');
      if (cleanQuery.length < 4) {
        setError('সঠিক মোবাইল নম্বরের শেষ ৪ ডিজিট বা সম্পূর্ণ নম্বরটি লিখুন!');
        return;
      }
      
      const found = orders.filter(order => {
        const orderPhoneClean = order.customerPhone.replace(/[^0-9]/g, '');
        return orderPhoneClean.endsWith(cleanQuery) || cleanQuery.endsWith(orderPhoneClean);
      });

      if (found.length === 0) {
        setError('দুঃখিত, এই মোবাইল নম্বরের বিপরীতে কোনো অর্ডার খুঁজে পাওয়া যায়নি!');
      } else if (found.length === 1) {
        setMatchedOrders(found);
        setSelectedOrder(found[0]);
      } else {
        setMatchedOrders(found);
      }
    } else {
      const cleanId = query.toUpperCase().replace(/\s/g, '');
      const found = orders.find(order => {
        const orderIdUpper = order.id.toUpperCase();
        return orderIdUpper === cleanId || orderIdUpper === 'ML-' + cleanId || orderIdUpper.replace('ML-', '') === cleanId;
      });

      if (found) {
        setMatchedOrders([found]);
        setSelectedOrder(found);
      } else {
        setError('উক্ত অর্ডার আইডিটি খুঁজে পাওয়া যায়নি! ক্যাশ মেমোতে থাকা সঠিক আইডিটি লিখুন (যেমন: ML-123456)।');
      }
    }
  };

  const getStatusBadgeStyles = (status: OrderStatus) => {
    switch (status) {
      case 'pending': 
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200/60', text: 'অপেক্ষমাণ (Pending)' };
      case 'processing': 
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', text: 'প্রক্রিয়াকরণ চলছে (Processing)' };
      case 'shipped': 
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200/60', text: 'কুরিয়ারে হস্তান্তর (Shipped)' };
      case 'delivered': 
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', text: 'ডেলিভারি সম্পন্ন (Delivered)' };
      case 'cancelled': 
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200/60', text: 'বাতিল করা হয়েছে (Cancelled)' };
      default: 
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200/60', text: 'অজানা স্টেট' };
    }
  };

  // Estimate delivery range based on createdAt date string
  const getEstimatedDelivery = (dateStr: string) => {
    try {
      // Standard formats like "2026-07-12 11:20" or ISO
      const cleanDate = dateStr.replace(' ', 'T');
      const dateObj = new Date(cleanDate);
      if (isNaN(dateObj.getTime())) return '৩ থেকে ৫ কার্যদিবস';
      
      const startEst = new Date(dateObj);
      startEst.setDate(dateObj.getDate() + 2);
      const endEst = new Date(dateObj);
      endEst.setDate(dateObj.getDate() + 4);

      const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      const formatBanglaDate = (d: Date) => {
        const dateNum = d.getDate();
        const monthName = months[d.getMonth()];
        const convertToBangla = (n: number) => {
          const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
          return n.toString().split('').map(digit => banglaDigits[parseInt(digit, 10)] || digit).join('');
        };
        return `${convertToBangla(dateNum)}ই ${monthName}`;
      };

      return `${formatBanglaDate(startEst)} - ${formatBanglaDate(endEst)} এর মধ্যে`;
    } catch {
      return '৩ থেকে ৫ কার্যদিবস';
    }
  };

  // Helper to generate step time
  const getStepTime = (baseDateStr: string, stepIndex: number, currentStatus: OrderStatus) => {
    try {
      const cleanDate = baseDateStr.replace(' ', 'T');
      const date = new Date(cleanDate);
      if (isNaN(date.getTime())) {
        return stepIndex === 0 ? baseDateStr : '';
      }

      const addOffsets = [
        0, // step 0 (confirmed): base time
        2 * 60 * 60 * 1000, // step 1 (processing): +2 hours
        26 * 60 * 60 * 1000, // step 2 (shipped): +26 hours (~1 day)
        48 * 60 * 60 * 1000, // step 3 (delivered): +48 hours (2 days)
      ];

      let isCompleted = false;
      if (currentStatus === 'pending' && stepIndex === 0) isCompleted = true;
      if (currentStatus === 'processing' && stepIndex <= 1) isCompleted = true;
      if (currentStatus === 'shipped' && stepIndex <= 2) isCompleted = true;
      if (currentStatus === 'delivered' && stepIndex <= 3) isCompleted = true;

      if (!isCompleted) return '';

      const offsetDate = new Date(date.getTime() + addOffsets[stepIndex]);
      
      const day = String(offsetDate.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[offsetDate.getMonth()];
      const year = offsetDate.getFullYear();
      let hours = offsetDate.getHours();
      const minutes = String(offsetDate.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

      return `${day}-${month}-${year}, ${timeStr}`;
    } catch {
      return stepIndex === 0 ? baseDateStr : '';
    }
  };

  const maskName = (name: string) => {
    if (!name) return '';
    const trimmed = name.trim();
    const parts = trimmed.split(' ');
    if (parts.length > 1 && (parts[0] === 'মো:' || parts[0] === 'মোঃ' || parts[0].toLowerCase() === 'md' || parts[0].toLowerCase() === 'md.')) {
      return `${parts[0]} **********`;
    }
    if (trimmed.length > 4) {
      return trimmed.slice(0, 3) + '**********';
    }
    return trimmed + '**********';
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const clean = phone.replace(/\s/g, '');
    if (clean.length >= 8) {
      return `${clean.slice(0, 3)}*****${clean.slice(-3)}`;
    }
    return phone.slice(0, 2) + '****' + phone.slice(-2);
  };

  const maskAddress = (address: string) => {
    if (!address) return '';
    const trimmed = address.trim();
    if (trimmed.length > 12) {
      return `**** ${trimmed.slice(-14)}`;
    }
    return '**** ' + trimmed;
  };

  // Steps Builder with Icons & interactive styling
  const getTimelineSteps = (order: Order) => {
    const status = order.status;
    const isCancelled = status === 'cancelled';

    if (isCancelled) {
      return [
        {
          id: 'step-1',
          title: 'অর্ডারটি সিস্টেমে সাবমিট করা হয়েছে',
          desc: 'গ্রাহকের পছন্দ করা পণ্যগুলো সফলভাবে আমাদের সিস্টেমে রিকুয়েস্ট করা হয়েছিল।',
          time: getStepTime(order.createdAt, 0, 'delivered'),
          isCompleted: true,
          isActive: false,
          icon: Box,
        },
        {
          id: 'step-2',
          title: 'অর্ডারটি বাতিল বা রিফান্ড করা হয়েছে',
          desc: 'দুঃখিত, কোনো বিশেষ কারণে বা স্টক জটিলতায় এই অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত জানতে বা অন্য যেকোনো প্রয়োজনে কাস্টমার কেয়ারে যোগাযোগ করুন।',
          time: getStepTime(order.createdAt, 1, 'delivered'),
          isCompleted: true,
          isActive: true,
          isError: true,
          icon: AlertCircle,
        }
      ];
    }

    return [
      {
        id: 'step-1',
        title: 'অর্ডার নিশ্চিতকরণ (Confirmed)',
        desc: 'আপনার ক্যাশ মেমোটি সফলভাবে নিশ্চিত করা হয়েছে এবং অর্ডার আইডি প্রস্তুত।',
        time: getStepTime(order.createdAt, 0, status),
        isCompleted: true,
        isActive: status === 'pending',
        icon: Receipt,
      },
      {
        id: 'step-2',
        title: 'প্যাকেজিং ও কোয়ালিটি কন্ট্রোল',
        desc: 'আপনার পণ্যগুলো খাঁটি ও তাজা রয়েছে কিনা তা অভিজ্ঞ টিম দ্বারা পরীক্ষা করে প্রিমিয়াম প্যাকেজিং করা হচ্ছে।',
        time: getStepTime(order.createdAt, 1, status) || (status === 'pending' ? '' : 'চলমান...'),
        isCompleted: status === 'processing' || status === 'shipped' || status === 'delivered',
        isActive: status === 'processing',
        icon: Box,
      },
      {
        id: 'step-3',
        title: 'কুরিয়ারে হস্তান্তর সম্পন্ন (Shipped)',
        desc: 'পণ্যটি আপনার ঠিকানায় পৌঁছানোর উদ্দেশ্যে বিশ্বস্ত কুরিয়ার পার্টনারের কাছে নিরাপদে হ্যান্ডওভার করা হয়েছে।',
        time: getStepTime(order.createdAt, 2, status),
        isCompleted: status === 'shipped' || status === 'delivered',
        isActive: status === 'shipped',
        icon: Truck,
      },
      {
        id: 'step-4',
        title: 'ডেলিভারি সম্পন্ন (Delivered)',
        desc: 'আপনার ঠিকানায় পণ্যটি সফলভাবে পৌঁছে দেওয়া হয়েছে। আমাদের প্রাকৃতিক উপাদানের গুণগত মান কেমন লাগলো জানাতে ভুলবেন না!',
        time: getStepTime(order.createdAt, 3, status),
        isCompleted: status === 'delivered',
        isActive: status === 'delivered',
        icon: CheckCircle,
      }
    ];
  };

  const getWhatsAppSupportUrl = (orderId?: string) => {
    const rawPhone = siteConfig.contactPhone || '01700000000';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const text = orderId 
      ? `আসসালামু আলাইকুম, আমি আমার অর্ডার নম্বর ${orderId} এর ডেলিভারি স্টেটাস জানতে চাচ্ছি।`
      : `আসসালামু আলাইকুম, আমি আমার অর্ডার ডেলিভারি সংক্রান্ত বিষয়ে সহায়তা চাচ্ছি।`;
    return `https://wa.me/88${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="order-tracking-modal-root" className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              key="order-tracking-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
            />

            <div className="flex min-h-full items-center justify-center p-4 text-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
              className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5 bg-gradient-to-r from-orange-50/50 via-amber-50/20 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <Truck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 leading-tight flex items-center gap-1.5">
                      অর্ডার ডেলিভারি ট্র্যাকিং
                      <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-black uppercase tracking-wider hidden sm:inline border border-orange-100">Live</span>
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-0.5">
                      রিয়েল-টাইমে আপনার ক্যাশ মেমোর অর্ডার স্টেটাস ও শিপিং ট্র্যাকিং করুন
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="overflow-y-auto p-6 space-y-6 flex-grow scrollbar-thin">
                {/* Search Bar with vibrant styling */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-4.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="ক্যাশ মেমোর অর্ডার নম্বর (উদাঃ ML-123456) অথবা মোবাইল নম্বর দিন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-xs md:text-sm pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 focus:outline-hidden focus:ring-4 focus:ring-orange-100 focus:border-orange-500 focus:bg-white transition-all font-bold placeholder-slate-400 shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl cursor-pointer active:scale-95 transition-all shadow-md shadow-orange-500/15 shrink-0 flex items-center gap-1.5"
                  >
                    <Search className="w-4 h-4" />
                    <span>খুঁজুন</span>
                  </button>
                </form>

                {/* Error State */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2.5 shadow-xs"
                  >
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Initial Beautiful Layout when not searched */}
                {!searched && !error && (
                  <div className="text-center py-8 px-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white border border-slate-100 rounded-3xl">
                    <div className="flex justify-center py-2">
                      <div className="loader">
                        <div className="truckWrapper">
                          <div className="truckBody">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 198 93"
                              className="trucksvg"
                            >
                              <path
                                strokeWidth="3"
                                stroke="#282828"
                                fill="#F83D3D"
                                d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"
                              ></path>
                              <path
                                strokeWidth="3"
                                stroke="#282828"
                                fill="#7D7C7C"
                                d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"
                              ></path>
                              <path
                                strokeWidth="2"
                                stroke="#282828"
                                fill="#282828"
                                d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z"
                              ></path>
                              <rect
                                strokeWidth="2"
                                stroke="#282828"
                                fill="#FFFCAB"
                                rx="1"
                                height="7"
                                width="5"
                                y="63"
                                x="187"
                              ></rect>
                              <rect
                                strokeWidth="2"
                                stroke="#282828"
                                fill="#282828"
                                rx="1"
                                height="11"
                                width="4"
                                y="81"
                                x="193"
                              ></rect>
                              <rect
                                strokeWidth="3"
                                stroke="#282828"
                                fill="#DFDFDF"
                                rx="2.5"
                                height="90"
                                width="121"
                                y="1.5"
                                x="6.5"
                              ></rect>
                              <rect
                                strokeWidth="2"
                                stroke="#282828"
                                fill="#DFDFDF"
                                rx="2"
                                height="4"
                                width="6"
                                y="84"
                                x="1"
                              ></rect>
                            </svg>
                          </div>
                          <div className="truckTires">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 30 30"
                              className="tiresvg"
                            >
                              <circle
                                strokeWidth="3"
                                stroke="#282828"
                                fill="#282828"
                                r="13.5"
                                cy="15"
                                cx="15"
                              ></circle>
                              <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
                            </svg>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 30 30"
                              className="tiresvg"
                            >
                              <circle
                                strokeWidth="3"
                                stroke="#282828"
                                fill="#282828"
                                r="13.5"
                                cy="15"
                                cx="15"
                              ></circle>
                              <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
                            </svg>
                          </div>
                          <div className="road"></div>
                          <svg
                            xmlSpace="preserve"
                            viewBox="0 0 453.459 453.459"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            xmlns="http://www.w3.org/2000/svg"
                            id="Capa_1"
                            version="1.1"
                            fill="#000000"
                            className="lampPost"
                          >
                            <path
                              d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993
c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514
c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16
c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914
h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75
v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795
V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0z
M232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017
h78.747C231.693,100.736,232.77,106.162,232.77,111.694z"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 max-w-md mx-auto">
                      <h4 className="text-sm md:text-base font-black text-slate-800">অর্ডারের ডেলিভারি তথ্য জানতে চান?</h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        আপনার ক্যাশ মেমোর অর্ডার আইডি (যেমন: <span className="font-mono font-extrabold text-orange-600 bg-orange-50 px-1 py-0.5 rounded">ML-123456</span>) অথবা অর্ডার করার সময় যে মোবাইল নম্বর ব্যবহার করেছিলেন, সেটি দিয়ে সার্চ করলেই রিয়েল-টাইম লাইভ ট্র্যাকিং দেখতে পাবেন।
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap justify-center gap-4.5 text-[10px] font-bold text-gray-400">
                      <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ২৪/৭ স্বয়ংক্রিয় সেবা</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-500" /> রিয়েল-টাইম আপডেট</span>
                    </div>
                  </div>
                )}

                {/* Multi-Order Choice Screen */}
                {searched && !error && matchedOrders.length > 1 && !selectedOrder && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl w-fit border border-orange-100/60">
                        📱 আপনার মোবাইল নম্বরে {matchedOrders.length}টি অর্ডার পাওয়া গেছে:
                      </h4>
                    </div>
                    <div className="grid gap-3 max-h-80 overflow-y-auto pr-1.5">
                      {matchedOrders.map((order) => {
                        const style = getStatusBadgeStyles(order.status);
                        return (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className="p-4 bg-white border border-slate-100 hover:border-orange-300 rounded-2xl hover:shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-black text-orange-600 group-hover:underline">
                                  {order.id}
                                </span>
                                <span className="text-[10px] text-gray-300 font-bold">•</span>
                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  {order.createdAt}
                                </span>
                              </div>
                              <p className="text-[11px] font-extrabold text-slate-700 truncate max-w-sm">
                                পণ্যসমূহ: {order.items.map(item => item.productName).join(', ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <span className="text-sm font-black text-slate-800 block">
                                  {order.totalAmount}৳
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${style.bg}`}>
                                  {style.text}
                                </span>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Single Detailed Order Tracking Visualizer */}
                {selectedOrder && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Back Option for Multi-listings */}
                    {matchedOrders.length > 1 && (
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100"
                      >
                        ← আপনার অন্যান্য অর্ডার তালিকায় ফিরে যান
                      </button>
                    )}

                    {/* Live Moving Truck Animation Widget */}
                    <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-white border border-orange-200/70 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                      <div className="text-left space-y-1">
                        <span className="text-[10px] bg-orange-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">ডেলিভারি অন দ্য ওয়ে</span>
                        <h4 className="text-xs md:text-sm font-black text-slate-800">আপনার পণ্যটি নিরাপদে গন্তব্যের দিকে</h4>
                        <p className="text-[10px] text-gray-500 font-bold">লাইভ কুরিয়ার ট্রান্সপোর্ট চলছে...</p>
                      </div>
                      <div className="py-1 px-3 bg-white/80 rounded-xl border border-orange-100 shadow-inner overflow-hidden flex items-center justify-center">
                        <div className="loader scale-90">
                          <div className="truckWrapper">
                            <div className="truckBody">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 198 93"
                                className="trucksvg"
                              >
                                <path
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#F83D3D"
                                  d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"
                                ></path>
                                <path
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#7D7C7C"
                                  d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"
                                ></path>
                                <path
                                  strokeWidth="2"
                                  stroke="#282828"
                                  fill="#282828"
                                  d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z"
                                ></path>
                                <rect
                                  strokeWidth="2"
                                  stroke="#282828"
                                  fill="#FFFCAB"
                                  rx="1"
                                  height="7"
                                  width="5"
                                  y="63"
                                  x="187"
                                ></rect>
                                <rect
                                  strokeWidth="2"
                                  stroke="#282828"
                                  fill="#282828"
                                  rx="1"
                                  height="11"
                                  width="4"
                                  y="81"
                                  x="193"
                                ></rect>
                                <rect
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#DFDFDF"
                                  rx="2.5"
                                  height="90"
                                  width="121"
                                  y="1.5"
                                  x="6.5"
                                ></rect>
                                <rect
                                  strokeWidth="2"
                                  stroke="#282828"
                                  fill="#DFDFDF"
                                  rx="2"
                                  height="4"
                                  width="6"
                                  y="84"
                                  x="1"
                                ></rect>
                              </svg>
                            </div>
                            <div className="truckTires">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 30 30"
                                className="tiresvg"
                              >
                                <circle
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#282828"
                                  r="13.5"
                                  cy="15"
                                  cx="15"
                                ></circle>
                                <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
                              </svg>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 30 30"
                                className="tiresvg"
                              >
                                <circle
                                  strokeWidth="3"
                                  stroke="#282828"
                                  fill="#282828"
                                  r="13.5"
                                  cy="15"
                                  cx="15"
                                ></circle>
                                <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
                              </svg>
                            </div>
                            <div className="road"></div>
                            <svg
                              xmlSpace="preserve"
                              viewBox="0 0 453.459 453.459"
                              xmlnsXlink="http://www.w3.org/1999/xlink"
                              xmlns="http://www.w3.org/2000/svg"
                              id="Capa_1"
                              version="1.1"
                              fill="#000000"
                              className="lampPost"
                            >
                              <path
                                d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993
c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514
c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16
c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914
h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75
v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795
V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0z
M232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017
h78.747C231.693,100.736,232.77,106.162,232.77,111.694z"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estimated Delivery Banner */}
                    {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="text-left text-xs">
                          <p className="text-emerald-800 font-extrabold">আনুমানিক ডেলিভারির সময়:</p>
                          <p className="text-slate-600 font-bold mt-0.5">
                            আপনার পণ্যটি <span className="text-emerald-700 font-black">{getEstimatedDelivery(selectedOrder.createdAt)}</span> মধ্যে ডেলিভারি সম্পন্ন হতে পারে।
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Premium Order Details Card */}
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-left">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">মেমো / অর্ডার আইডি</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-mono font-black text-orange-600">{selectedOrder.id}</span>
                          <button
                             type="button"
                             onClick={() => handleCopyId(selectedOrder.id)}
                             className="p-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-orange-500 transition-all cursor-pointer flex items-center justify-center"
                             title="অর্ডার আইডি কপি করুন"
                          >
                            {copiedId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">অর্ডারের তারিখ</span>
                        <span className="font-black text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {selectedOrder.createdAt}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">মোট পেমেন্ট</span>
                        <span className="font-black text-slate-800 flex items-center gap-0.5">
                          {selectedOrder.totalAmount}৳ 
                          <span className="text-[9px] text-[#006437] bg-emerald-50 border border-emerald-100 px-1 rounded font-black ml-1 uppercase">COD</span>
                        </span>
                      </div>
                      <div className="space-y-1 col-span-2 md:col-span-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ডেলিভারি এলাকা</span>
                        <span className="font-black text-slate-700 flex items-center gap-1 truncate" title={selectedOrder.deliveryAddress}>
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {selectedOrder.area}, {selectedOrder.district}
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Progress Bar */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>ডেলিভারি প্রগ্রেস (Progress)</span>
                        <span className="text-orange-600 font-extrabold bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100/50">
                          {selectedOrder.status === 'pending' ? '২৫%' :
                           selectedOrder.status === 'processing' ? '৫০%' :
                           selectedOrder.status === 'shipped' ? '৭৫%' :
                           selectedOrder.status === 'cancelled' ? 'বাতিল' : '১০০%'} সম্পন্ন
                        </span>
                      </div>
                      
                      <div className="relative pt-2 pb-1">
                        {/* Background Bar */}
                        <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: selectedOrder.status === 'pending' ? '25%' :
                                     selectedOrder.status === 'processing' ? '50%' :
                                     selectedOrder.status === 'shipped' ? '75%' :
                                     selectedOrder.status === 'cancelled' ? '100%' : '100%'
                            }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${selectedOrder.status === 'cancelled' ? 'bg-rose-500' : 'bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500'}`}
                          />
                        </div>

                        {/* Dots with Icons */}
                        <div className="flex justify-between -mt-4.5">
                          {[
                            { label: 'কনফার্মড', status: 'pending', icon: Receipt },
                            { label: 'প্যাকেজিং', status: 'processing', icon: Box },
                            { label: 'শিপড', status: 'shipped', icon: Truck },
                            { label: 'ডেলিভারড', status: 'delivered', icon: CheckCircle },
                          ].map((pStep, index) => {
                            const orderStatus = selectedOrder.status;
                            const isCancelled = orderStatus === 'cancelled';
                            
                            // Determine state
                            let isDone = false;
                            let isCurrent = false;

                            if (orderStatus === 'pending') {
                              if (index === 0) { isDone = true; isCurrent = true; }
                            } else if (orderStatus === 'processing') {
                              if (index <= 1) isDone = true;
                              if (index === 1) isCurrent = true;
                            } else if (orderStatus === 'shipped') {
                              if (index <= 2) isDone = true;
                              if (index === 2) isCurrent = true;
                            } else if (orderStatus === 'delivered') {
                              isDone = true;
                              if (index === 3) isCurrent = true;
                            }

                            const IconComponent = pStep.icon;

                            return (
                              <div key={index} className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                                  isCancelled
                                    ? 'bg-rose-100 border-rose-500 text-rose-500'
                                    : isCurrent
                                      ? 'bg-orange-500 border-orange-500 text-white scale-110 shadow-md shadow-orange-500/20'
                                      : isDone
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'bg-white border-slate-200 text-slate-400'
                                }`}>
                                  <IconComponent className="w-3.5 h-3.5 stroke-[2]" />
                                </div>
                                <span className={`text-[10px] font-black mt-1.5 ${isCurrent ? 'text-orange-600 font-extrabold' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                                  {pStep.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Animated Stepper Line Timeline */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span>লাইভ ডেলিভারি প্রগ্রেস ট্র্যাকিং:</span>
                      </h4>

                      <div className="relative pl-8.5 space-y-7 text-left">
                        {/* Dynamic Filling Line Background */}
                        <div className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-gray-100" />
                        
                        {/* Framer-Motion filling bar (green glow overlay) */}
                        {selectedOrder.status !== 'cancelled' && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ 
                              height: selectedOrder.status === 'pending' ? '0%' :
                                      selectedOrder.status === 'processing' ? '33%' :
                                      selectedOrder.status === 'shipped' ? '66%' : '100%'
                            }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                            className="absolute left-3 top-2.5 w-0.5 bg-gradient-to-b from-orange-500 to-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                          />
                        )}

                        {getTimelineSteps(selectedOrder).map((step, idx) => {
                          const isError = step.isError;
                          const StepIcon = step.icon;
                          
                          return (
                            <div key={step.id} className="relative group">
                              {/* Step dot indicator */}
                              <div className={`absolute -left-8.5 top-0 w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                                isError
                                  ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200'
                                  : step.isActive
                                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110'
                                    : step.isCompleted
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-400'
                              }`}>
                                <StepIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                              </div>

                              {/* Content block with premium card backgrounds */}
                              <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                                isError 
                                  ? 'bg-rose-50/40 border-rose-100/60'
                                  : step.isActive 
                                    ? 'bg-orange-50/40 border-orange-200/50 shadow-sm'
                                    : step.isCompleted
                                      ? 'bg-white border-slate-100'
                                      : 'bg-white/40 border-dashed border-gray-200 text-gray-400'
                              }`}>
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <span className={`text-xs font-black ${
                                    isError
                                      ? 'text-rose-600'
                                      : step.isActive
                                        ? 'text-orange-600 text-[13px]'
                                        : step.isCompleted
                                          ? 'text-slate-800'
                                          : 'text-gray-400'
                                  }`}>
                                    {step.title}
                                  </span>
                                  {step.isActive && (
                                    <span className="text-[8px] font-black uppercase bg-orange-100 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full animate-pulse">
                                      Active Step
                                    </span>
                                  )}
                                  {step.time && (
                                    <span className="text-[10px] text-[#006437] font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                      {step.time}
                                    </span>
                                  )}
                                </div>
                                <p className={`leading-relaxed text-[11px] font-medium mt-1 ${
                                  step.isCompleted || step.isActive ? 'text-gray-500' : 'text-gray-400/80'
                                }`}>
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recipient Profile Card (Masked details) */}
                    <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-5 text-left space-y-4">
                      <h4 className="text-sm font-black text-slate-800 tracking-tight">Recipient</h4>
                      <div className="grid grid-cols-3 gap-y-3.5 text-xs text-slate-600 font-medium">
                        <div className="text-gray-400 font-bold">Name</div>
                        <div className="col-span-2 text-slate-800 font-extrabold">{maskName(selectedOrder.customerName)}</div>
                        
                        <div className="text-gray-400 font-bold">Address</div>
                        <div className="col-span-2 text-slate-800 font-extrabold">{maskAddress(selectedOrder.deliveryAddress)}</div>
                        
                        <div className="text-gray-400 font-bold">Phone Number</div>
                        <div className="col-span-2 text-slate-800 font-mono font-extrabold">{maskPhone(selectedOrder.customerPhone)}</div>
                        
                        <div className="text-gray-400 font-bold">Current Hub</div>
                        <div className="col-span-2 text-slate-800 font-extrabold">
                          {selectedOrder.area} ({selectedOrder.district})
                        </div>
                      </div>
                    </div>

                    {/* Order Complaint Support Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setComplaintDescription('');
                          setComplaintSuccessNotice(null);
                          setComplaintError(null);
                          setShowComplaintModal(true);
                        }}
                        className="w-full bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 font-black py-2.5 px-3 rounded-2xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2 shadow-2xs"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>এই অর্ডারে কোনো সমস্যা? অভিযোগ / কম্পেলেইন জমা দিন</span>
                      </button>
                    </div>

                    {/* Footer Contact for Help */}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-slate-100">
                      <a
                        href={getWhatsAppSupportUrl(selectedOrder.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs px-4 py-3.5 rounded-2xl text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
                      >
                        <MessageSquare className="w-4.5 h-4.5 stroke-[2]" />
                        <span>হোয়াটসঅ্যাপে সরাসরি সহায়তা পান</span>
                      </a>
                      {siteConfig.contactPhone && (
                        <a
                          href={`tel:${siteConfig.contactPhone}`}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-3.5 rounded-2xl text-center cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-slate-200/40"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          <span>কল করুন: {siteConfig.contactPhone}</span>
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>

    {/* Complaint Submission Modal in OrderTracking */}
    <AnimatePresence>
      {showComplaintModal && selectedOrder && (
        <div key="order-tracking-complaint-modal-root" className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            key="tracking-complaint-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowComplaintModal(false)}
            className="fixed inset-0 bg-black/40"
          />
          <motion.div
            key="tracking-complaint-panel"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative z-10 border border-orange-200 max-h-[90vh] overflow-y-auto text-left"
          >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900">অভিযোগ / কম্পেলেইন জমা দিন</h4>
                    <p className="text-[11px] text-gray-400 font-bold">অর্ডার #{selectedOrder.id} এর বিপরীতে অভিযোগ নথিভুক্ত করুন</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {complaintSuccessNotice ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h5 className="font-black text-slate-800 text-base">অভিযোগ সফলভাবে জমা হয়েছে!</h5>
                  <p className="text-xs text-gray-600 font-bold max-w-xs mx-auto leading-relaxed">{complaintSuccessNotice}</p>
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(false)}
                    className="bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer hover:bg-slate-900 mt-2"
                  >
                    ঠিক আছে
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!complaintDescription.trim()) {
                      setComplaintError('অনুগ্রহ করে সমস্যার কারণ বা বিস্তারিত নোট লিখুন');
                      return;
                    }
                    setComplaintSubmitting(true);
                    setComplaintError(null);
                    try {
                      const categoryLabels: Record<string, string> = {
                        damage: 'পণ্য ক্ষতিগ্রস্থ / নষ্ট',
                        delay: 'ডেলিভারি বিলম্ব',
                        wrong_item: 'ভুল বা কম পণ্য প্রাপ্তি',
                        quality: 'পণ্যের গুণমান নিয়ে আপত্তি',
                        price: 'বিল / মূল্য বা পেমেন্ট সংক্রান্ত',
                        behavior: 'ডেলিভারি ম্যান বা আচরণ সংক্রান্ত',
                        other: 'অন্যান্য সমস্যা'
                      };

                      if (onAddComplaint) {
                        await onAddComplaint({
                          orderId: selectedOrder.id,
                          customerName: selectedOrder.customerName,
                          customerPhone: selectedOrder.customerPhone,
                          customerAddress: `${selectedOrder.deliveryAddress}, ${selectedOrder.area}, ${selectedOrder.district}`,
                          issueCategory: complaintCategory,
                          issueCategoryLabel: categoryLabels[complaintCategory] || 'সাধারণ সমস্যা',
                          priority: complaintPriority,
                          description: complaintDescription.trim(),
                          createdBy: 'গ্রাহক (ট্র্যাকিং মেমো)'
                        });
                      }
                      setComplaintSuccessNotice('আপনার অভিযোগটি সফলভাবে নথিভুক্ত করা হয়েছে! আমাদের প্রতিনিধি দ্রুত সমাধানের জন্য আপনার সাথে যোগাযোগ করবেন।');
                    } catch (err: any) {
                      setComplaintError(err?.message || 'অভিযোগ জমা করতে ব্যর্থ হয়েছে');
                    } finally {
                      setComplaintSubmitting(false);
                    }
                  }}
                  className="space-y-3.5 text-xs"
                >
                  {/* Auto-filled details from Selected Order */}
                  <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">অটো-লোড হওয়া তথ্য</span>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                      <div>
                        <span className="text-gray-400 block text-[10px]">গ্রাহকের নাম:</span>
                        <span className="font-black text-slate-800">{selectedOrder.customerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">মোবাইল নম্বর *:</span>
                        <span className="font-mono font-black text-slate-800">{selectedOrder.customerPhone}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">অর্ডার আইডি:</span>
                        <span className="font-mono font-black text-orange-600">#{selectedOrder.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">ঠিকানা:</span>
                        <span className="truncate block" title={selectedOrder.deliveryAddress}>
                          {selectedOrder.deliveryAddress}, {selectedOrder.area}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Issue Category */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      সমস্যার ধরন (Issue Category) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="damage">পণ্য ক্ষতিগ্রস্থ / নষ্ট</option>
                      <option value="delay">ডেলিভারি বিলম্ব</option>
                      <option value="wrong_item">ভুল বা কম পণ্য প্রাপ্তি</option>
                      <option value="quality">পণ্যের গুণমান নিয়ে আপত্তি</option>
                      <option value="price">বিল / মূল্য বা পেমেন্ট সংক্রান্ত</option>
                      <option value="behavior">ডেলিভারি ম্যান বা আচরণ সংক্রান্ত</option>
                      <option value="other">অন্যান্য সমস্যা</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      অগ্রাধিকার (Priority)
                    </label>
                    <select
                      value={complaintPriority}
                      onChange={(e) => setComplaintPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="normal">সাধারণ (Normal)</option>
                      <option value="high">জরুরি (High)</option>
                      <option value="urgent">অতি জরুরি (Urgent)</option>
                    </select>
                  </div>

                  {/* Detailed Description / Reason */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      অভিযোগের কারণ বা বিস্তারিত নোট <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="সমস্যার বিস্তারিত লিখুন (যেমন: কী সমস্যা হয়েছে, কোনো ত্রুটি আছে কি না ইত্যাদি)..."
                      value={complaintDescription}
                      onChange={(e) => {
                        setComplaintDescription(e.target.value);
                        if (complaintError) setComplaintError(null);
                      }}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-hidden focus:border-orange-500 resize-none text-xs"
                    />
                    {complaintError && <p className="text-red-500 text-[10px] mt-1 font-bold">{complaintError}</p>}
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowComplaintModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs cursor-pointer transition-colors"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={complaintSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{complaintSubmitting ? 'জমা হচ্ছে...' : 'অভিযোগ জমা দিন'}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
