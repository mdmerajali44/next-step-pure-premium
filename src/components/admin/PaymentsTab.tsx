import React, { useState } from 'react';
import { CreditCard, Search, Copy, X } from 'lucide-react';
import { Order, SiteConfig } from '../../types';
import { matchesSearchWithNumerals } from '../../types';

interface PaymentsTabProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  notify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  siteConfig: SiteConfig;
}

export default function PaymentsTab({
  orders,
  onUpdateOrderStatus,
  notify,
  siteConfig,
}: PaymentsTabProps) {
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [pendingConfirmOrderId, setPendingConfirmOrderId] = useState<string | null>(null);
  const [confirmCodeInput, setConfirmCodeInput] = useState('');
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => {
      setCopiedTextId(null);
    }, 2000);
    notify('কপি করা হয়েছে!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5.5 h-5.5 text-orange-600" />
            <span>পেমেন্ট ও ট্রানজেকশন ট্র্যাকিং</span>
          </h3>
          <p className="text-[11px] text-gray-400 font-bold mt-0.5">গ্রাহকের বিকাশ/নগদ পেমেন্ট ট্রানজেকশন এবং অর্ডার ভেরিফিকেশন প্যানেল।</p>
        </div>
      </div>

      {/* Search & Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="অর্ডার আইডি, কাস্টমার নাম, ফোন বা TrxID দিয়ে খুঁজুন..."
            value={paymentSearch}
            onChange={(e) => setPaymentSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-100 bg-white font-medium"
          />
        </div>

        <div className="md:col-span-3">
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

        <div className="md:col-span-3">
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-100 bg-white font-bold text-gray-600"
          >
            <option value="all">সকল পেমেন্ট অবস্থা</option>
            <option value="pending">পেন্ডিং / যাচাইয়ের অপেক্ষায়</option>
            <option value="approved">অনুমোদিত পেমেন্ট</option>
            <option value="cancelled">বাতিলকৃত ট্রানজেকশন</option>
          </select>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="p-4">অর্ডার আইডি ও তারিখ</th>
                <th className="p-4">গ্রাহকের নাম ও ফোন</th>
                <th className="p-4">পেমেন্ট পদ্ধতি</th>
                <th className="p-4">টাকা পাঠানো নম্বর</th>
                <th className="p-4">ট্রানজেকশন আইডি (TrxID)</th>
                <th className="p-4 text-right">টাকার পরিমাণ</th>
                <th className="p-4 text-center">স্ট্যাটাস</th>
                <th className="p-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {orders.filter((order) => {
                const matchesSearch = 
                  matchesSearchWithNumerals(order.id, paymentSearch) ||
                  matchesSearchWithNumerals(order.customerName, paymentSearch) ||
                  matchesSearchWithNumerals(order.customerPhone, paymentSearch) ||
                  (order.bkashNumber && matchesSearchWithNumerals(order.bkashNumber, paymentSearch)) ||
                  (order.trxId && matchesSearchWithNumerals(order.trxId, paymentSearch));

                const matchesMethod = 
                  paymentMethodFilter === 'all' || 
                  order.paymentMethod === paymentMethodFilter;

                let matchesStatus = true;
                if (paymentStatusFilter === 'pending') {
                  matchesStatus = order.status === 'pending';
                } else if (paymentStatusFilter === 'approved') {
                  matchesStatus = order.status !== 'pending' && order.status !== 'cancelled';
                } else if (paymentStatusFilter === 'cancelled') {
                  matchesStatus = order.status === 'cancelled';
                }
                return matchesSearch && matchesMethod && matchesStatus;
              }).length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">
                    কোন ট্রানজেকশন বা পেমেন্ট পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                orders.filter((order) => {
                  const matchesSearch = 
                    matchesSearchWithNumerals(order.id, paymentSearch) ||
                    matchesSearchWithNumerals(order.customerName, paymentSearch) ||
                    matchesSearchWithNumerals(order.customerPhone, paymentSearch) ||
                    (order.bkashNumber && matchesSearchWithNumerals(order.bkashNumber, paymentSearch)) ||
                    (order.trxId && matchesSearchWithNumerals(order.trxId, paymentSearch));

                  const matchesMethod = 
                    paymentMethodFilter === 'all' || 
                    order.paymentMethod === paymentMethodFilter;

                  let matchesStatus = true;
                  if (paymentStatusFilter === 'pending') {
                    matchesStatus = order.status === 'pending';
                  } else if (paymentStatusFilter === 'approved') {
                    matchesStatus = order.status !== 'pending' && order.status !== 'cancelled';
                  } else if (paymentStatusFilter === 'cancelled') {
                    matchesStatus = order.status === 'cancelled';
                  }
                  return matchesSearch && matchesMethod && matchesStatus;
                }).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-gray-800">#{order.id}</span>
                        <span className="text-[10px] text-gray-400 font-bold mt-0.5">{order.createdAt}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{order.customerName}</span>
                        <span className="text-[10px] text-gray-400 font-semibold mt-0.5">{order.customerPhone}</span>
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
                          <span className="font-bold text-gray-800 font-mono">{order.bkashNumber}</span>
                          <button
                            onClick={() => handleCopy(order.bkashNumber!, `num-${order.id}`)}
                            className="text-gray-400 hover:text-orange-500 transition-colors p-0.5 cursor-pointer border-0 bg-transparent"
                            title="নম্বর কপি করুন"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedTextId === `num-${order.id}` && (
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 rounded border border-emerald-100 font-extrabold">কপিড!</span>
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
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 rounded border border-emerald-100 font-extrabold">কপিড!</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="p-4 font-extrabold text-gray-800 text-right text-sm">
                      ৳{order.totalAmount}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-block ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        {order.status === 'pending' ? 'যাচাইযোগ্য / পেন্ডিং' :
                         order.status === 'processing' ? 'প্রসেসিং / কনফার্মড' :
                         order.status === 'shipped' ? 'শিপড' :
                         order.status === 'delivered' ? 'ডেলিভার্ড' : 'বাতিলকৃত'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {order.status === 'pending' ? (
                          pendingConfirmOrderId === order.id ? (
                            <div className="flex flex-col items-center gap-1 bg-orange-50 border border-orange-200 p-1.5 rounded-lg max-w-[140px] mx-auto">
                              <div className="flex gap-1 items-center">
                                <input
                                  type="text"
                                  placeholder="কোড"
                                  value={confirmCodeInput}
                                  onChange={(e) => setConfirmCodeInput(e.target.value)}
                                  className="w-12 px-1 py-0.5 border border-orange-300 rounded text-[10px] bg-white text-center font-extrabold focus:outline-hidden focus:ring-1 focus:ring-orange-400"
                                />
                                <button
                                  onClick={() => {
                                    if (confirmCodeInput === '247') {
                                      onUpdateOrderStatus(order.id, 'processing');
                                      notify(`অর্ডার ${order.id}-এর পেমেন্ট সফলভাবে যাচাই করে অর্ডারটি কনফার্ম (প্রসেসিং) করা হয়েছে।`, 'success');
                                      setPendingConfirmOrderId(null);
                                      setConfirmCodeInput('');
                                    } else {
                                      notify('ভুল কোড! সঠিক কোড দিন।', 'error');
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer shrink-0 border-0"
                                >
                                  যাচাই
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingConfirmOrderId(null);
                                    setConfirmCodeInput('');
                                  }}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[9px] font-black px-1 py-0.5 rounded cursor-pointer shrink-0 border-0"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setPendingConfirmOrderId(order.id);
                                setConfirmCodeInput('');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md transition-all shadow-xs cursor-pointer border-0"
                            >
                              পেমেন্ট কনফার্ম করুন
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => setSelectedPaymentOrder(order)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer border-0"
                          >
                            বিবরণী দেখুন
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Payment Detail Overlay Modal */}
      {selectedPaymentOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-fade-in">
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
              {/* Customer Summary */}
              <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 border">
                <p className="font-extrabold text-gray-800 border-b border-gray-200 pb-1 mb-1">গ্রাহকের বিবরণী</p>
                <p><span className="text-gray-400 font-bold">নাম:</span> <strong className="text-gray-800">{selectedPaymentOrder.customerName}</strong></p>
                <p><span className="text-gray-400 font-bold">মোবাইল:</span> <strong className="text-gray-800">{selectedPaymentOrder.customerPhone}</strong></p>
                <p><span className="text-gray-400 font-bold">ঠিকানা:</span> <strong className="text-gray-800">{selectedPaymentOrder.deliveryAddress}, {selectedPaymentOrder.area}, {selectedPaymentOrder.district}</strong></p>
              </div>

              {/* Payment Details */}
              <div className="bg-orange-50/50 p-3 rounded-xl space-y-1.5 border border-orange-100">
                <p className="font-extrabold text-orange-800 border-b border-orange-200 pb-1 mb-1">লেনদেন ও টাকার বিবরণী</p>
                <p><span className="text-gray-400 font-bold">পেমেন্ট পদ্ধতি:</span> <strong className="text-gray-800 font-mono uppercase">{selectedPaymentOrder.paymentMethod}</strong></p>
                {selectedPaymentOrder.bkashNumber && (
                  <p><span className="text-gray-400 font-bold">টাকা পাঠানোর নম্বর:</span> <strong className="text-gray-800 font-mono">{selectedPaymentOrder.bkashNumber}</strong></p>
                )}
                {selectedPaymentOrder.trxId && (
                  <p><span className="text-gray-400 font-bold">ট্রানজেকশন আইডি (TrxID):</span> <strong className="text-gray-800 font-mono bg-orange-100/50 px-1.5 py-0.5 rounded">{selectedPaymentOrder.trxId}</strong></p>
                )}
                <p><span className="text-gray-400 font-bold">সর্বমোট টাকার পরিমাণ:</span> <strong className="text-orange-600 text-sm font-black">৳{selectedPaymentOrder.totalAmount}</strong></p>
              </div>

              {/* Items list */}
              <div className="space-y-1.5">
                <p className="font-extrabold text-gray-800">অর্ডারকৃত পণ্য তালিকা</p>
                <div className="divide-y max-h-40 overflow-y-auto pr-1">
                  {selectedPaymentOrder.items.map((item, index) => (
                    <div key={index} className="py-2 flex justify-between items-center">
                      <span className="font-bold text-gray-700 max-w-[200px] truncate">{item.productName} ({item.unit})</span>
                      <span className="font-extrabold text-gray-500">৳{item.price} × {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end">
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
    </div>
  );
}
