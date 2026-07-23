import { Product, Review } from '../types';

export const getSeedReviews = (product: Product): Review[] => {
  const pName = (product.name || '').toLowerCase();
  const catLower = (product.category || '').toLowerCase();

  if (catLower.includes('মধু') || pName.includes('মধু') || product.id.startsWith('h') || product.id === 'p1') {
    return [
      {
        id: `rev-1-${product.id}`,
        name: 'আরিফুর রহমান',
        rating: 5,
        comment: `মাশাল্লাহ! ${product.name}-এর স্বাদ ও ঘ্রাণ অসাধারণ। ১০০% খাঁটি সুন্দরবনের মধুই মনে হয়েছে।`,
        date: '০৩ জুলাই, ২০২৬',
        isVerified: true
      },
      {
        id: `rev-2-${product.id}`,
        name: 'উম্মে হাবিবা',
        rating: 5,
        comment: 'বাচ্চাদের জন্য নিয়েছিলাম, ওরা খুব পছন্দ করেছে। কোনো চিনি বা ভেজাল নেই। প্যাকিং খুব চমৎকার ছিল।',
        date: '২৮ জুন, ২০২৬',
        isVerified: true
      },
      {
        id: `rev-3-${product.id}`,
        name: 'মো: জাহিদ হাসান',
        rating: 4,
        comment: 'খুবই খাঁটি গুণসম্পন্ন। সুন্দর ফ্লেভার। খুব সুন্দর প্যাকিংয়ে দ্রুত ডেলিভারি পেয়েছি।',
        date: '২৫ জুন, ২০২৬',
        isVerified: true
      }
    ];
  }

  if (catLower.includes('ঘি') || catLower.includes('তেল') || pName.includes('ঘি') || pName.includes('তেল') || product.id === 'p2' || product.id === 'p3') {
    return [
      {
        id: `rev-1-${product.id}`,
        name: 'আশরাফুল ইসলাম',
        rating: 5,
        comment: `আহা! ${product.name}-এর সুবাস আসলেই চমৎকার। সিরাজগঞ্জের খাঁটি গাওয়া ঘিয়ের অরিজিনাল স্বাদ পেলাম।`,
        date: '০৪ জুলাই, ২০২৬',
        isVerified: true
      },
      {
        id: `rev-2-${product.id}`,
        name: 'সুলতানা পারভীন',
        rating: 5,
        comment: 'পণ্যের মান খুবই উন্নত। রঙ এবং টেক্সচার দেখে বোঝাই যায় এটা অর্গানিক উপায়ে তৈরি। পুনরায় অর্ডার করব ইনশাল্লাহ।',
        date: '৩০ জুন, ২০২৬',
        isVerified: true
      }
    ];
  }

  if (catLower.includes('আম') || pName.includes('আম') || product.id === 'p4' || product.id.startsWith('m')) {
    return [
      {
        id: `rev-1-${product.id}`,
        name: 'শাফায়েত হোসেন',
        rating: 5,
        comment: `গাছপাকা ফ্রেশ ${product.name}! কোনো কেমিক্যাল বা ফরমালিন ছাড়া যে আম পাওয়া যায় আপনারাই প্রমাণ।`,
        date: '০৫ জুলাই, ২০২৬',
        isVerified: true
      },
      {
        id: `rev-2-${product.id}`,
        name: 'তাসনিম আরা',
        rating: 5,
        comment: 'কুরিয়ারে আসার পরেও একটা আমও নষ্ট হয়নি। সুন্দর ক্যারেট প্যাকিং ছিল। আমগুলোর দারুণ মিষ্টি স্বাদ!',
        date: '০২ জুলাই, ২০২৬',
        isVerified: true
      }
    ];
  }

  if (catLower.includes('গুড়') || pName.includes('গুড়')) {
    return [
      {
        id: `rev-1-${product.id}`,
        name: 'তানভীর আহমেদ',
        rating: 5,
        comment: `খাঁটি ট্রাডিশনাল ${product.name}। কোনো কেমিক্যাল গন্ধ নেই, পায়েস ও পিঠায় সেরা স্বাদ এনে দিয়েছে।`,
        date: '০৪ জুলাই, ২০২৬',
        isVerified: true
      },
      {
        id: `rev-2-${product.id}`,
        name: 'মেহেদী হাসান',
        rating: 5,
        comment: 'প্যাকিং ও ডেলিভারি দারুণ ছিল। গুড়ের ফ্রেশ গন্ধ ও আসল মিষ্টতা বজায় আছে।',
        date: '২৯ জুন, ২০২৬',
        isVerified: true
      }
    ];
  }

  if (catLower.includes('খেজুর') || pName.includes('খেজুর')) {
    return [
      {
        id: `rev-1-${product.id}`,
        name: 'রাশেদুল ইসলাম',
        rating: 5,
        comment: `প্রিমিয়াম কোয়ালিটির ${product.name}। খেজুরগুলো বেশ বড় ও নরম, খেতে দারুণ সুস্বাদু।`,
        date: '০৩ জুলাই, ২০২৬',
        isVerified: true
      },
      {
        id: `rev-2-${product.id}`,
        name: 'ফাতেমা বেগম',
        rating: 5,
        comment: 'খুবই ফ্রেশ এবং পরিষ্কার প্যাকেজিং। বাজারের থেকে অনেক ভালো মানের প্রিমিয়াম পণ্য।',
        date: '২৭ জুন, ২০২৬',
        isVerified: true
      }
    ];
  }

  return [
    {
      id: `rev-1-${product.id}`,
      name: 'ফারহান আহমেদ',
      rating: 5,
      comment: `${product.name}-এর মান খুবই চমৎকার ও একদম খাঁটি। অর্গানিক জিনিস খুঁজছিলাম, সঠিক জিনিস পেয়েছি।`,
      date: '০২ জুলাই, ২০২৬',
      isVerified: true
    },
    {
      id: `rev-2-${product.id}`,
      name: 'সাবিহা ইয়াসমিন',
      rating: 5,
      comment: 'খুবই ভালো সার্ভিস। ডেলিভারির সময় পণ্য দেখে নেয়ার সুযোগ থাকায় অর্ডার করতে কোনো ভয় কাজ করেনি। ১০০% অরিজিনাল।',
      date: '২৮ জুন, ২০২৬',
      isVerified: true
    }
  ];
};

export const getProductReviewsFromStorage = (product: Product): Review[] => {
  const key = `mango_lover_reviews_${product.id}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed: Review[] = JSON.parse(saved);
      // Check if parsed has stale generic seed reviews from earlier version
      if (parsed.length > 0 && parsed.some(r => r.id && r.id.startsWith('seed-'))) {
        const freshSeed = getSeedReviews(product);
        localStorage.setItem(key, JSON.stringify(freshSeed));
        return freshSeed;
      }
      return parsed;
    } catch {
      // fallback to seed
    }
  }
  const seed = getSeedReviews(product);
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
};
