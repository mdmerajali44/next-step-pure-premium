import React, { useState } from 'react';
import { RefreshCw, MessageSquare, Check, Trash2, X, Eye, AlertTriangle } from 'lucide-react';
import { ProductRequest, SiteConfig } from '../../types';

interface RequestsTabProps {
  productRequests: ProductRequest[];
  siteConfig: SiteConfig;
  onUpdateProductRequestStatus: (id: string, status: 'pending' | 'completed' | 'contacted') => void;
  onDeleteProductRequest: (id: string) => void;
  notify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  handlePrint: (elementId: string, title: string) => void;
}

export default function RequestsTab({
  productRequests,
  siteConfig,
  onUpdateProductRequestStatus,
  onDeleteProductRequest,
  notify,
  handlePrint,
}: RequestsTabProps) {
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<ProductRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<ProductRequest | null>(null);

  return (
    <div className="space-y-6">
      {/* Header block with search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-900 text-lg md:text-xl">
            🛍️ গ্রাহক প্রোডাক্ট রিকুয়েস্ট সমূহ
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            স্টক আউট পণ্যের জন্য কাস্টমারদের পাঠানো রিকুয়েস্টের তালিকা এবং তাদের সাথে যোগাযোগের স্ট্যাটাস।
          </p>
        </div>
      </div>

      {/* Stats overview row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">অপেক্ষমাণ রিকুয়েস্ট</p>
            <h3 className="font-extrabold text-gray-800 text-base md:text-lg">
              {productRequests.filter(r => r.status === 'pending').length} টি
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">যোগাযোগ করা হয়েছে</p>
            <h3 className="font-extrabold text-gray-800 text-base md:text-lg">
              {productRequests.filter(r => r.status === 'contacted').length} টি
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">সম্পন্ন রিকুয়েস্ট</p>
            <h3 className="font-extrabold text-gray-800 text-base md:text-lg">
              {productRequests.filter(r => r.status === 'completed').length} টি
            </h3>
          </div>
        </div>
      </div>

      {/* Main table view */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
            সর্বমোট {productRequests.length} টি রিকুয়েস্ট পাওয়া গেছে
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                <th className="p-4">অনুরোধকৃত পণ্য বিবরণ</th>
                <th className="p-4">গ্রাহকের বিবরণী</th>
                <th className="p-4">তারিখ ও আইডি</th>
                <th className="p-4 text-center">অবস্থা / স্ট্যাটাস</th>
                <th className="p-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
              {productRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 font-bold">
                    কোন প্রোডাক্ট রিকুয়েস্ট পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                productRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 shrink-0 flex items-center justify-center border border-gray-100">
                          <img 
                            src={req.productImage} 
                            alt={req.productName} 
                            className="max-h-full max-w-full object-contain mix-blend-multiply" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-gray-800 text-sm leading-snug">
                            {req.productName}
                          </h4>
                          <p className="text-[10px] text-[#006437] font-bold mt-0.5">
                            পরিমাণ: <span className="text-orange-600 text-xs font-black">{req.quantity}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-gray-800 text-xs">
                          {req.customerName}
                        </h4>
                        <p className="text-[11px] font-mono font-bold text-gray-600">
                          📞 {req.customerPhone}
                        </p>
                        <p className="text-[10px] text-gray-400 leading-normal max-w-[200px] truncate" title={req.deliveryAddress}>
                          🏠 {req.deliveryAddress}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold text-[10px]">
                          {req.id}
                        </span>
                        <p className="text-[10px] text-gray-400 font-bold">
                          {new Date(req.createdAt).toLocaleString('bn-BD', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-block border ${
                        req.status === 'pending'
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : req.status === 'contacted'
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {req.status === 'pending' ? 'পেন্ডিং' :
                         req.status === 'contacted' ? 'যোগাযোগ করা হয়েছে' : 'সম্পন্ন / ডেলিভার্ড'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-[200px] mx-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedRequestDetails(req)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-amber-200 shadow-3xs"
                          title="স্লিপ ও বিস্তারিত দেখুন"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>স্লিপ দেখুন</span>
                        </button>

                        {req.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateProductRequestStatus(req.id, 'contacted');
                              notify('রিকুয়েস্টের অবস্থা "যোগাযোগ করা হয়েছে" এ পরিবর্তন করা হয়েছে।', 'success');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer shadow-3xs"
                            title="যোগাযোগ করা হয়েছে চিহ্নিত করুন"
                          >
                            যোগাযোগ করেছি
                          </button>
                        )}
                        {req.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateProductRequestStatus(req.id, 'completed');
                              notify('রিকুয়েস্টটি সফলভাবে "সম্পন্ন" চিহ্নিত করা হয়েছে।', 'success');
                            }}
                            className="bg-[#006437] hover:bg-[#004d2a] text-white text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer shadow-3xs"
                            title="সম্পন্ন চিহ্নিত করুন"
                          >
                            সম্পন্ন করুন
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setRequestToDelete(req);
                          }}
                          className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-400 p-1.5 rounded-lg transition-colors cursor-pointer border-0"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* PRODUCT REQUEST DETAILS SLIP MODAL OVERLAY */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-xl w-full relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-1.5 font-sans">
                  🛍️ প্রোডাক্ট রিকুয়েস্ট স্লিপ (ID: {selectedRequestDetails.id})
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">গ্রাহকের স্টক-আউট পণ্য চাহিদার বিবরণী ও স্লিপ</p>
              </div>
              <button
                onClick={() => setSelectedRequestDetails(null)}
                className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Visual Slip block (Looks like a real ticket) */}
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-3xs relative text-left">
                <div className="absolute -top-3 left-4 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Request Details Slip
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Product Info */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">অনুরোধকৃত প্রোডাক্ট বিবরণ</span>
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center border border-gray-200 shadow-3xs">
                        <img 
                          src={selectedRequestDetails.productImage} 
                          alt={selectedRequestDetails.productName} 
                          className="max-h-full max-w-full object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-sm leading-snug">
                          {selectedRequestDetails.productName}
                        </h4>
                        <p className="text-xs text-[#006437] font-black">
                          পরিমাণ: <span className="text-orange-600 text-sm font-black">{selectedRequestDetails.quantity}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Customer Info */}
                  <div className="space-y-1.5 sm:border-l sm:border-amber-200 sm:pl-4">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">গ্রাহকের যোগাযোগের বিবরণী</span>
                    <p className="text-sm font-extrabold text-slate-800">{selectedRequestDetails.customerName}</p>
                    <p className="text-xs font-mono font-bold text-slate-700">📞 {selectedRequestDetails.customerPhone}</p>
                    <p className="text-xs text-slate-500 leading-normal font-medium">
                      🏠 {selectedRequestDetails.deliveryAddress}
                    </p>
                  </div>
                </div>

                {/* Date and Status Bar */}
                <div className="pt-3 border-t border-dashed border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block">অনুরোধের সময়কাল:</span>
                    <span className="font-bold text-gray-600">
                      {new Date(selectedRequestDetails.createdAt).toLocaleString('bn-BD', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block sm:text-right">বর্তমান অবস্থা:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block border mt-0.5 ${
                      selectedRequestDetails.status === 'pending'
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : selectedRequestDetails.status === 'contacted'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {selectedRequestDetails.status === 'pending' ? 'পেন্ডিং' :
                       selectedRequestDetails.status === 'contacted' ? 'যোগাযোগ করা হয়েছে' : 'সম্পন্ন / ডেলিভার্ড'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Bar Inside Modal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-left">
                <p className="text-xs font-bold text-slate-700">অবস্থা পরিবর্তন ও নিয়ন্ত্রণ করুন:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRequestDetails.status === 'pending' && (
                    <button
                      onClick={() => {
                        onUpdateProductRequestStatus(selectedRequestDetails.id, 'contacted');
                        setSelectedRequestDetails({ ...selectedRequestDetails, status: 'contacted' });
                        notify('রিকুয়েস্টের অবস্থা "যোগাযোগ করা হয়েছে" এ পরিবর্তন করা হয়েছে।', 'success');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                    >
                      <span>যোগাযোগ করেছি</span>
                    </button>
                  )}
                  {selectedRequestDetails.status !== 'completed' && (
                    <button
                      onClick={() => {
                        onUpdateProductRequestStatus(selectedRequestDetails.id, 'completed');
                        setSelectedRequestDetails({ ...selectedRequestDetails, status: 'completed' });
                        notify('রিকুয়েস্টটি সফলভাবে "সম্পন্ন" চিহ্নিত করা হয়েছে।', 'success');
                      }}
                      className="bg-[#006437] hover:bg-[#004d2a] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                    >
                      <span>সম্পন্ন হয়েছে</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setRequestToDelete(selectedRequestDetails);
                      setSelectedRequestDetails(null);
                    }}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer ml-auto flex items-center gap-1 border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>রিকুয়েস্টটি মুছে দিন</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-slate-50 rounded-b-3xl text-xs font-bold">
              <button
                onClick={() => setSelectedRequestDetails(null)}
                className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => {
                  if (selectedRequestDetails) {
                    handlePrint('printable-request-slip', `Request Slip #${selectedRequestDetails.id}`);
                  }
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1.5"
              >
                <span>🖨️ স্লিপটি প্রিন্ট করুন</span>
              </button>
            </div>
          </div>

          {/* PRINT ELEMENT */}
          <div id="printable-request-slip" className="hidden print:block bg-white p-6 text-black font-sans border-4 border-double border-slate-800 rounded-xl space-y-6 max-w-xl mx-auto text-left">
            {/* Header */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-300 animate-none flex flex-col items-center justify-center">
              {siteConfig?.storeLogo && (
                <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 mx-auto mb-1.5 shadow-2xs">
                  <img 
                    src={siteConfig.storeLogo} 
                    alt="Store Logo" 
                    className="w-full h-full object-cover scale-105" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              {siteConfig.storeNameImage ? (
                <img 
                  src={siteConfig.storeNameImage} 
                  alt={siteConfig.storeName} 
                  className="h-10 object-contain mx-auto" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  <h1 className="text-xl font-black text-slate-950">{siteConfig.storeName || "ম্যাংগো লাভার"}</h1>
                  {siteConfig.storeSloganImage ? (
                    <img 
                      src={siteConfig.storeSloganImage} 
                      alt={siteConfig.storeSlogan} 
                      className="h-4 object-contain mx-auto mt-1" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-600">{siteConfig.storeSlogan || "Pure & Organic Food Shop"}</p>
                  )}
                </>
              )}
              <p className="text-[10px] text-slate-500 mt-1">মোবাইল: {siteConfig.contactPhone || "01837-587551"} | ঠিকানা: {siteConfig.contactOffice || "Satkhira"}</p>
            </div>

            <div className="text-center py-1">
              <span className="border-2 border-slate-950 px-3 py-1 text-xs font-black uppercase bg-slate-100">স্টক আউট প্রোডাক্ট রিকুয়েস্ট স্লিপ</span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-slate-200">
              <div className="space-y-1">
                <p><span className="font-bold">স্লিপ আইডি:</span> <strong className="font-sans">#{selectedRequestDetails.id}</strong></p>
                <p><span className="font-bold">অনুরোধের সময়:</span> <strong>{selectedRequestDetails.createdAt}</strong></p>
                <p><span className="font-bold">অবস্থা:</span> <strong>{selectedRequestDetails.status === 'pending' ? 'Pending' : selectedRequestDetails.status === 'contacted' ? 'Contacted' : 'Completed'}</strong></p>
              </div>
              <div className="space-y-1">
                <p><span className="font-bold">গ্রাহকের নাম:</span> <strong>{selectedRequestDetails.customerName}</strong></p>
                <p><span className="font-bold">ফোন নম্বর:</span> <strong>{selectedRequestDetails.customerPhone}</strong></p>
                <p><span className="font-bold">ডেলিভারি ঠিকানা:</span> <strong>{selectedRequestDetails.deliveryAddress}</strong></p>
              </div>
            </div>

            {/* Product Requested */}
            <div className="space-y-2 text-xs">
              <p className="font-black text-slate-800">অনুরোধকৃত প্রোডাক্ট ও বিবরণী:</p>
              <div className="flex items-center justify-between border-2 border-slate-300 bg-slate-50 p-3 rounded-lg">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-950">{selectedRequestDetails.productName}</h4>
                  <p className="text-slate-500 mt-0.5 font-sans">প্রোডাক্ট আইডি: {selectedRequestDetails.productId}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-600">চাহিদার পরিমাণ</p>
                  <p className="text-base font-black text-orange-600">{selectedRequestDetails.quantity}</p>
                </div>
              </div>
            </div>

            <div className="text-center pt-8 text-[10px] text-slate-500 italic">
              "গ্রাহকের চাহিদা অনুযায়ী পণ্যটি স্টকে আসার সাথে সাথে এই স্লিপটি ব্যবহার করে অতিসত্বর যোগাযোগ করুন।"
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs text-slate-800">
              <div>
                <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 font-bold">প্রতিনিধির স্বাক্ষর</div>
              </div>
              <div>
                <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 font-bold">ম্যানেজার স্বাক্ষর</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base md:text-lg">মুছে ফেলার নিশ্চিতকরণ</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                আপনি কি নিশ্চিতভাবে ক্রেতা <strong className="text-gray-800 font-bold">"{requestToDelete.customerName}"</strong>-এর প্রোডাক্ট রিকুয়েস্টটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRequestToDelete(null)}
                className="w-1/2 py-2 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => {
                  onDeleteProductRequest(requestToDelete.id);
                  notify('গ্রাহকের প্রোডাক্ট রিকুয়েস্টটি সফলভাবে মুছে ফেলা হয়েছে।', 'success');
                  setRequestToDelete(null);
                }}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
