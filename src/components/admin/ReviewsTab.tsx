import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit3, 
  Plus, 
  MessageSquare, 
  CheckCircle2, 
  Filter, 
  ShieldCheck, 
  AlertCircle, 
  X,
  Package
} from 'lucide-react';
import { Product, Review } from '../../types';
import { getProductReviewsFromStorage } from '../../utils/reviewUtils';

interface ReviewsTabProps {
  products: Product[];
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
  filterProductId?: string | null;
}

interface EnrichedReview extends Review {
  productId: string;
  productName: string;
  productImage: string;
}

export default function ReviewsTab({ products, notify, filterProductId }: ReviewsTabProps) {
  const [allReviews, setAllReviews] = useState<EnrichedReview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>(filterProductId || 'all');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modals & Confirmation States
  const [deletingReview, setDeletingReview] = useState<EnrichedReview | null>(null);
  const [editingReview, setEditingReview] = useState<EnrichedReview | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState('');
  const [editIsHidden, setEditIsHidden] = useState(false);

  // Add Form Fields
  const [addProductId, setAddProductId] = useState<string>(products[0]?.id || '');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRating, setAddRating] = useState<number>(5);
  const [addComment, setAddComment] = useState('');

  // Load reviews from localStorage for all products
  const loadAllReviews = () => {
    const list: EnrichedReview[] = [];

    products.forEach((prod) => {
      const prodReviews = getProductReviewsFromStorage(prod);

      prodReviews.forEach((rev) => {
        list.push({
          ...rev,
          productId: prod.id,
          productName: prod.name,
          productImage: prod.image
        });
      });
    });

    setAllReviews(list);
  };

  useEffect(() => {
    loadAllReviews();
  }, [products]);

  useEffect(() => {
    if (filterProductId) {
      setSelectedProductFilter(filterProductId);
    }
  }, [filterProductId]);

  // Save product reviews back to localStorage
  const updateProductReviewsInStorage = (productId: string, updatedReviews: Review[]) => {
    const key = `mango_lover_reviews_${productId}`;
    localStorage.setItem(key, JSON.stringify(updatedReviews));
    loadAllReviews();
  };

  // Toggle Hide / Show
  const handleToggleHide = (review: EnrichedReview) => {
    const key = `mango_lover_reviews_${review.productId}`;
    const saved = localStorage.getItem(key);
    let prodReviews: Review[] = saved ? JSON.parse(saved) : [];

    prodReviews = prodReviews.map((r) => 
      r.id === review.id ? { ...r, isHidden: !r.isHidden } : r
    );

    updateProductReviewsInStorage(review.productId, prodReviews);
    notify(
      review.isHidden ? 'রিভিউটি সফলভাবে পুনরায় প্রকাশ করা হলো।' : 'রিভিউটি কাস্টমারদের থেকে লুকিয়ে (Hide) রাখা হলো।',
      'info'
    );
  };

  // Delete Review
  const handleConfirmDelete = () => {
    if (!deletingReview) return;

    const key = `mango_lover_reviews_${deletingReview.productId}`;
    const saved = localStorage.getItem(key);
    let prodReviews: Review[] = saved ? JSON.parse(saved) : [];

    prodReviews = prodReviews.filter((r) => r.id !== deletingReview.id);

    updateProductReviewsInStorage(deletingReview.productId, prodReviews);
    setDeletingReview(null);
    notify('কাস্টমার রিভিউটি সফলভাবে মুছে ফেলা হয়েছে।', 'success');
  };

  // Open Edit Modal
  const handleOpenEdit = (review: EnrichedReview) => {
    setEditingReview(review);
    setEditName(review.name);
    setEditPhone(review.phone || '');
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditIsHidden(Boolean(review.isHidden));
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    const key = `mango_lover_reviews_${editingReview.productId}`;
    const saved = localStorage.getItem(key);
    let prodReviews: Review[] = saved ? JSON.parse(saved) : [];

    prodReviews = prodReviews.map((r) => 
      r.id === editingReview.id 
        ? { 
            ...r, 
            name: editName.trim(), 
            phone: editPhone.trim(), 
            rating: editRating, 
            comment: editComment.trim(),
            isHidden: editIsHidden 
          } 
        : r
    );

    updateProductReviewsInStorage(editingReview.productId, prodReviews);
    setEditingReview(null);
    notify('রিভিউ এর তথ্য সফলভাবে আপডেট করা হয়েছে।', 'success');
  };

  // Submit Add Review
  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addProductId || !addName.trim() || !addComment.trim()) {
      notify('অনুগ্রহ করে প্রয়োজনীয় তথ্যসমূহ প্রদান করুন।', 'error');
      return;
    }

    const key = `mango_lover_reviews_${addProductId}`;
    const saved = localStorage.getItem(key);
    let prodReviews: Review[] = saved ? JSON.parse(saved) : [];

    const newRev: Review = {
      id: `rev-admin-${Date.now()}`,
      name: addName.trim(),
      phone: addPhone.trim(),
      rating: addRating,
      comment: addComment.trim(),
      date: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
      isVerified: true,
      isHidden: false
    };

    prodReviews = [newRev, ...prodReviews];
    updateProductReviewsInStorage(addProductId, prodReviews);

    setShowAddModal(false);
    setAddName('');
    setAddPhone('');
    setAddComment('');
    setAddRating(5);
    notify('নতুন রিভিউটি সফলভাবে যোগ করা হয়েছে।', 'success');
  };

  // Filter Logic
  const filteredReviews = allReviews.filter((rev) => {
    const matchesSearch = 
      rev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rev.phone && rev.phone.includes(searchQuery)) ||
      rev.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.productName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProduct = selectedProductFilter === 'all' || rev.productId === selectedProductFilter;
    const matchesRating = selectedRatingFilter === 'all' || rev.rating === Number(selectedRatingFilter);
    const matchesStatus = 
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'visible' && !rev.isHidden) ||
      (selectedStatusFilter === 'hidden' && rev.isHidden);

    return matchesSearch && matchesProduct && matchesRating && matchesStatus;
  });

  // Group filtered reviews by productId
  const productGroupMap = new Map<string, EnrichedReview[]>();
  filteredReviews.forEach((rev) => {
    if (!productGroupMap.has(rev.productId)) {
      productGroupMap.set(rev.productId, []);
    }
    productGroupMap.get(rev.productId)!.push(rev);
  });

  interface ProductGroupData {
    productId: string;
    productName: string;
    productImage: string;
    reviews: EnrichedReview[];
    avgRating: string;
    visibleCount: number;
    hiddenCount: number;
  }

  const productGroups: ProductGroupData[] = [];
  productGroupMap.forEach((reviews, productId) => {
    const prod = products.find((p) => p.id === productId);
    const productName = prod?.name || reviews[0]?.productName || 'অজানা পণ্য';
    const productImage = prod?.image || reviews[0]?.productImage || '';
    const avg = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
    const vis = reviews.filter((r) => !r.isHidden).length;
    const hid = reviews.filter((r) => r.isHidden).length;

    productGroups.push({
      productId,
      productName,
      productImage,
      reviews,
      avgRating: avg,
      visibleCount: vis,
      hiddenCount: hid
    });
  });

  const totalCount = allReviews.length;
  const visibleCount = allReviews.filter((r) => !r.isHidden).length;
  const hiddenCount = allReviews.filter((r) => r.isHidden).length;
  const avgRating = totalCount > 0 
    ? (allReviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1) 
    : '5.0';

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 fill-white text-white" />
            <h2 className="text-xl md:text-2xl font-black">কাস্টমার রেটিং ও রিভিউ অ্যাডমিন কন্ট্রোল Panel</h2>
          </div>
          <p className="text-amber-100 text-xs md:text-sm font-semibold mt-1">
            খারাপ বা ভুয়া রিভিউ হাইড অথবা মুছে ফেলুন এবং ওয়েবসাইট রেটিং নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-white text-amber-700 hover:bg-amber-50 font-black text-xs md:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ম্যানুয়াল রিভিউ যোগ করুন</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs">
          <span className="text-xs font-extrabold text-gray-400 block">মোট রিভিউ</span>
          <span className="text-2xl font-black text-slate-800">{totalCount} টি</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs">
          <span className="text-xs font-extrabold text-emerald-600 block">ওয়েবসাইটে প্রকাশিত</span>
          <span className="text-2xl font-black text-emerald-700">{visibleCount} টি</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs">
          <span className="text-xs font-extrabold text-red-500 block">হাইড/লুকায়িত রিভিউ</span>
          <span className="text-2xl font-black text-red-600">{hiddenCount} টি</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-amber-600 block">গড় রেটিং</span>
            <span className="text-2xl font-black text-slate-800">{avgRating}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম, ফোন বা কমেন্ট খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Product Filter */}
          <div className="relative">
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">সব পণ্য ({products.length}টি)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="relative">
            <select
              value={selectedRatingFilter}
              onChange={(e) => setSelectedRatingFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">সকল স্টার রেটিং</option>
              <option value="5">⭐⭐⭐⭐⭐ (৫ স্টার)</option>
              <option value="4">⭐⭐⭐⭐ (৪ স্টার)</option>
              <option value="3">⭐⭐⭐ (৩ স্টার)</option>
              <option value="2">⭐⭐ (২ স্টার)</option>
              <option value="1">⭐ (১ স্টার - খারাপ)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="visible">ওয়েবসাইটে প্রকাশিত (Visible)</option>
              <option value="hidden">হাইডকৃত (Hidden)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Cards List Grouped by Product */}
      {productGroups.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400 space-y-2">
          <MessageSquare className="w-10 h-10 mx-auto text-gray-300" />
          <p className="font-extrabold text-sm text-gray-500">কোনো কাস্টমার রিভিউ পাওয়া যায়নি</p>
          <p className="text-xs">ফিল্টার পরিবর্তন করে চেক করুন অথবা নতুন রিভিউ যোগ করুন।</p>
        </div>
      ) : (
        <div className="space-y-6">
          {productGroups.map((group) => (
            <div
              key={group.productId}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Product Card Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-4 md:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-500/20">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 border-amber-400/30 bg-black/40 shrink-0">
                    <img
                      src={group.productImage}
                      alt={group.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-amber-300">{group.productName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < Math.round(Number(group.avgRating)) ? 'fill-current' : 'text-slate-600'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black text-amber-200">({group.avgRating}/5)</span>
                      <span className="text-xs text-slate-300 font-extrabold">• মোট {group.reviews.length}টি রিভিউ</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {group.visibleCount}টি প্রকাশিত
                  </span>
                  {group.hiddenCount > 0 && (
                    <span className="text-xs font-extrabold text-red-400 bg-red-950/80 px-2.5 py-1 rounded-lg border border-red-500/30">
                      {group.hiddenCount}টি লুকায়িত
                    </span>
                  )}
                </div>
              </div>

              {/* Product Reviews List - max height showing up to 5 review items with scrollbar */}
              <div className="p-4 md:p-5 bg-gray-50/50 space-y-3 max-h-[520px] overflow-y-auto">
                {group.reviews.map((rev) => (
                  <div
                    key={`${rev.productId}-${rev.id}`}
                    className={`bg-white border rounded-xl p-3.5 md:p-4 transition-all shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                      rev.isHidden 
                        ? 'border-red-200 bg-red-50/20 opacity-80' 
                        : 'border-gray-100 hover:border-amber-200'
                    }`}
                  >
                    {/* Review Content */}
                    <div className="space-y-1.5 flex-1 text-left">
                      {/* Customer Name, Date, Rating */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
                            <span>{rev.name}</span>
                            {rev.phone && (
                              <span className="text-xs text-gray-500 font-mono">({rev.phone})</span>
                            )}
                          </h4>
                          <span className="text-[10px] font-extrabold text-gray-400">
                            • {rev.date}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Rating Stars */}
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current text-amber-400' : 'text-gray-200'}`}
                              />
                            ))}
                            <span className="text-xs font-black text-slate-700 ml-1">({rev.rating}/5)</span>
                          </div>

                          {rev.isHidden ? (
                            <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <EyeOff className="w-2.5 h-2.5" />
                              হাইডকৃত
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                              <Eye className="w-2.5 h-2.5" />
                              প্রকাশিত
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Review Comment */}
                      <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                      {/* Hide / Show Toggle Button */}
                      <button
                        onClick={() => handleToggleHide(rev)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                          rev.isHidden
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                        }`}
                        title={rev.isHidden ? 'ওয়েবসাইটে প্রকাশ করুন' : 'ওয়েবসাইটে হাইড করুন'}
                      >
                        {rev.isHidden ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>প্রকাশ করুন</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>হাইড করুন</span>
                          </>
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(rev)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>সম্পাদনা</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeletingReview(rev)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ডিলিট</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-left border border-red-100">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="font-black text-lg text-slate-800">রিভিউ ডিলিট করার কনফার্মেশন</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                আপনি কি নিশ্চিতভাবে <span className="font-bold text-slate-800">"{deletingReview.name}"</span> এর রিভিউটি মুছে ফেলতে চান? এটি মুছে ফেললে ওয়েবসাইট থেকে সম্পূর্ণ ডিলিট হয়ে যাবে।
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
              <p><span className="font-bold">পণ্য:</span> {deletingReview.productName}</p>
              <p><span className="font-bold">কমেন্ট:</span> "{deletingReview.comment}"</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer"
              >
                হ্যাঁ, নিশ্চিত ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Review */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form 
            onSubmit={handleSaveEdit}
            className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-left border border-gray-100"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <span>কাস্টমার রিভিউ সম্পাদনা</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-gray-700 mb-1">কাস্টমারের নাম</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 mb-1">স্টার রেটিং (১ - ৫)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= editRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="font-black text-slate-800 text-sm ml-2">{editRating} স্টার</span>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 mb-1">রিভিউ মন্তব্য / মতামত</label>
                <textarea
                  required
                  rows={3}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsHidden"
                  checked={editIsHidden}
                  onChange={(e) => setEditIsHidden(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-gray-300"
                />
                <label htmlFor="editIsHidden" className="font-extrabold text-slate-700 cursor-pointer">
                  ওয়েবসাইটে হাইড (Hide) করে রাখুন (কাস্টমাররা দেখতে পাবে না)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-sm"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Manual Review */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form 
            onSubmit={handleAddReviewSubmit}
            className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-left border border-gray-100"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>নতুন কাস্টমার রিভিউ ম্যানুয়ালি যোগ করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-gray-700 mb-1">পণ্য নির্বাচন করুন <span className="text-red-500">*</span></label>
                <select
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-800"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 mb-1">কাস্টমারের নাম <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সাকিব আল হাসান"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: 01700000000"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 mb-1">স্টার রেটিং (১ - ৫)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAddRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= addRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="font-black text-slate-800 text-sm ml-2">{addRating} স্টার</span>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 mb-1">রিভিউ কমেন্ট / মন্তব্য <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="কাস্টমারের পজিটিভ রিভিউ এখানে লিখুন..."
                  value={addComment}
                  onChange={(e) => setAddComment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm"
              >
                যোগ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
