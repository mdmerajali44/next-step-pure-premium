import React from 'react';
import { DollarSign, Check, ShoppingCart, Package } from 'lucide-react';
import { Product, Order } from '../../types';

interface OverviewTabProps {
  totalRevenue: number;
  completedRevenue: number;
  orders: Order[];
  pendingOrdersCount: number;
  products: Product[];
  setActiveTab: (tab: 'overview' | 'products' | 'orders' | 'marketing' | 'chats' | 'payments' | 'requests' | 'users' | 'sellers') => void;
}

export default function OverviewTab({
  totalRevenue,
  completedRevenue,
  orders,
  pendingOrdersCount,
  products,
  setActiveTab,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="bg-orange-100 text-orange-600 p-2.5 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">মোট বিক্রয়</p>
            <h3 className="font-extrabold text-gray-800 text-base md:text-lg">৳{totalRevenue}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="bg-green-100 text-green-600 p-2.5 rounded-xl">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">পরিশোধিত আয়</p>
            <h3 className="font-extrabold text-gray-800 text-base md:text-lg">৳{completedRevenue}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">মোট অর্ডার</p>
            <h3 className="font-extrabold text-gray-800 text-base md:text-lg">{orders.length} টি</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">নতুন অর্ডার</p>
            <h3 className="font-extrabold text-gray-800 text-base md:text-lg">{pendingOrdersCount} টি</h3>
          </div>
        </div>
      </div>

      {/* Bottom Quick lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Out of Stock Warning */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-gray-100 pb-2">
            🚨 স্টক এলার্ট (কম পরিমাণ)
          </h3>
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-60 pr-1 space-y-2">
            {products.filter(p => p.stock <= 5).length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">সব পণ্যের পর্যাপ্ত স্টক আছে!</p>
            ) : (
              products
                .filter(p => p.stock <= 5)
                .map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-2">
                    <div className="flex gap-2 items-center">
                      <img src={p.image} className="w-8 h-8 rounded-md object-cover border" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="font-bold text-gray-700 truncate max-w-[150px]">{p.name}</h4>
                        <p className="text-[10px] text-gray-400">{p.category}</p>
                      </div>
                    </div>
                    <span className={`font-extrabold px-2 py-0.5 rounded-full ${
                      p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      স্টক: {p.stock} টি
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-800 text-sm md:text-base">
              📦 সাম্প্রতিক ৪টি অর্ডার
            </h3>
            <button 
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
            >
              সব দেখুন
            </button>
          </div>
          <div className="divide-y divide-gray-100 space-y-2.5">
            {orders.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">কোন অর্ডার প্লেস করা হয়নি এখনও।</p>
            ) : (
              orders.slice(-4).reverse().map(order => (
                <div key={order.id} className="flex items-center justify-between text-xs py-1.5">
                  <div>
                    <h4 className="font-bold text-gray-700">{order.customerName}</h4>
                    <p className="text-[10px] text-gray-400">{order.customerPhone} | {order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-gray-800">৳{order.totalAmount}</p>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status === 'pending' ? 'অপেক্ষমাণ' :
                       order.status === 'processing' ? 'প্রসেসিং' :
                       order.status === 'shipped' ? 'শিপড্' :
                       order.status === 'delivered' ? 'ডেলিভার্ড' : 'বাতিল'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
