import { User, Product, Category, SiteConfig } from "./models";

// --- SEED DATA ---
export const INITIAL_CATEGORIES = [
  { id: '3', name: 'তেল ও ঘি', slug: 'oil-ghee', icon: 'Droplet', showInNavbar: true },
  { id: '2', name: 'মধু', slug: 'honey', icon: 'Jar', showInNavbar: true },
  { id: '1', name: 'হোমমেড', slug: 'homemade', icon: 'Home', showInNavbar: true },
  { id: '4', name: 'গুড় ও চিনি', slug: 'jaggery-sugar', icon: 'Cookie', showInNavbar: true },
  { id: '8', name: 'খাঁটি শস্য', slug: 'pure-grains', icon: 'Wheat', showInNavbar: true },
  { id: '7', name: 'খেজুর', slug: 'dates', icon: 'Calendar', showInNavbar: true },
  { id: '6', name: 'ফ্রেশ আম', slug: 'fresh-mango', icon: 'Apple', showInNavbar: true },
  { id: '5', name: 'লাচ্ছা সেমাই', slug: 'laccha-semai', icon: 'Wind', showInNavbar: true }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    name: 'আখের জুস পাউডার',
    description: 'গুড় ও চিনি, আখের জুস পাউডার, আমাদের উৎপাদিত',
    price: 400,
    image: '/src/assets/images/juice_powder_1782456192648.jpg',
    category: 'গুড় ও চিনি',
    unit: '1 KG',
    stock: 25,
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 30,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'p2',
    name: 'আখের দানাদার ঝোলা গুড় 1 KG',
    description: 'গুড় ও চিনি, আখের ঝোলা গুড়, আমাদের উৎপাদিত',
    price: 300,
    originalPrice: 450,
    image: '/src/assets/images/akher_gur_1782456206623.jpg',
    category: 'গুড় ও চিনি',
    unit: '1 KG',
    stock: 20,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 45,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'p3',
    name: 'আমসত্ত্বের আচার',
    description: 'হোমমেড, আচার, আমাদের উৎপাদিত',
    price: 350,
    image: '/src/assets/images/amsotto_achar_1782456219512.jpg',
    category: 'হোমমেড',
    unit: '0.5 KG',
    stock: 35,
    isFeatured: true,
    rating: 4.7,
    reviewsCount: 18,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'p4',
    name: 'খাঁটি গাওয়া ঘি',
    description: 'তেল ও ঘি, পাবনার গাওয়া ঘি, আমাদের উৎপাদিত',
    price: 750,
    image: '/src/assets/images/gawa_ghee_1782456236375.jpg',
    images: [
      '/src/assets/images/gawa_ghee_1782456236375.jpg',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=600&q=80'
    ],
    category: 'তেল ও ঘি',
    unit: '0.5 KG',
    stock: 40,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 52,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'p5',
    name: 'খাঁটি সরিষার তেল',
    description: 'তেল ও ঘি, সরিষার তেল, আমাদের উৎপাদিত',
    price: 300,
    image: '/src/assets/images/mustard_oil_1782456250479.jpg',
    category: 'তেল ও ঘি',
    unit: '1 Liter',
    stock: 60,
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 29,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'p6',
    name: 'ঘিয়ে ভাজা লাচ্ছা সেমাই',
    description: 'আমাদের উৎপাদিত, লাচ্ছা সেমাই',
    price: 650,
    image: '/src/assets/images/laccha_semai_1782456263350.jpg',
    category: 'লাচ্ছা সেমাই',
    unit: '0.5 KG',
    stock: 15,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 38,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'p6_alt',
    name: 'স্পেশাল লাচ্ছা সেমাই',
    description: 'স্বাস্থ্যকর ও পরিষ্কার পরিবেশে তৈরি, ঈদের মিষ্টি খাবার বা বিকেলের নাস্তার জন্য একদম পারফেক্ট।',
    price: 180,
    originalPrice: 210,
    image: 'https://images.unsplash.com/photo-1612966608997-30d411b48230?auto=format&fit=crop&w=600&q=80',
    category: 'লাচ্ছা সেমাই',
    unit: '৪০০ গ্রাম',
    stock: 35,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 22,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'p7',
    name: 'অর্গানিক খাঁটি আখের গুড় (Pure Sugarcane Jaggery)',
    description: 'ঐতিহ্যবাহী পদ্ধতিতে আখের রস জ্বাল দিয়ে তৈরি কেমিক্যাল মুক্ত নরম পাটালি আখের গুড়। পিঠা-পুলি, পায়েস বা চা তৈরিতে অতুলনীয় স্বাদ এনে দেয়।',
    price: 190,
    originalPrice: 220,
    image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
    category: 'গুড় ও চিনি',
    unit: '১ কেজি',
    stock: 22,
    isFeatured: false,
    rating: 4.5,
    reviewsCount: 11,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'p8',
    name: 'নিউট্রিটিয়াস হানি নাটস (Mixed Nuts with Honey)',
    description: 'কাজু বাদাম, পেস্তা বাদাম, কাঠ বাদাম, আখরোট, কিশমিশ এবং প্রিমিয়াম আলজেরিয়ান খেজুরের সাথে সুন্দরবনের খাঁটি মধু মিশ্রিত করে তৈরি এক অবিশ্বাস্য পুষ্টিকর এবং শক্তিবর্ধক হোমমেড ফুড।',
    price: 550,
    originalPrice: 620,
    image: 'https://images.unsplash.com/photo-1511117461117-573522c1b4ec?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1511117461117-573522c1b4ec?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80'
    ],
    category: 'হোমমেড',
    unit: '৪০০ গ্রাম',
    stock: 15,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 54,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'p9',
    name: 'লাল চালের চিঁড়া (Organic Red Rice Flakes)',
    description: 'ঐতিহ্যবাহী ঢেঁকি ছাঁটা লাল চাল থেকে প্রস্তুতকৃত স্বাস্থ্যসম্মত ফাইবার ও পুষ্টি সমৃদ্ধ চিঁড়া। প্রাতঃরাশে দই ও কলার সাথে অত্যন্ত উপাদেয় এবং স্বাস্থ্যকর।',
    price: 120,
    originalPrice: 140,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    category: 'খাঁটি শস্য',
    unit: '১ কেজি',
    stock: 60,
    isFeatured: false,
    rating: 4.4,
    reviewsCount: 9,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'h1',
    name: 'কালোজিরা ফুলের মধু',
    description: 'মধু, কালোজিরা ফুলের মধু, আমাদের উৎপাদিত',
    price: 700,
    originalPrice: 850,
    image: '/src/assets/images/kalojira_honey_1782465866977.jpg',
    category: 'মধু',
    unit: '1 KG',
    stock: 30,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 38,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'h2',
    name: 'লিচু ফুলের মধু',
    description: 'মধু, লিচু ফুলের মধু, আমাদের উৎপাদিত',
    price: 400,
    originalPrice: 500,
    image: '/src/assets/images/lychee_honey_1782465883260.jpg',
    category: 'মধু',
    unit: '1 KG',
    stock: 25,
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 22,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'h3',
    name: 'সরিষা ফুলের মধু',
    description: 'মধু, সরিষা ফুলের মধু, আমাদের উৎপাদিত',
    price: 400,
    originalPrice: 500,
    image: '/src/assets/images/mustard_honey_1782465897931.jpg',
    category: 'মধু',
    unit: '1 KG',
    stock: 40,
    isFeatured: true,
    rating: 4.7,
    reviewsCount: 19,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'h4',
    name: 'সুন্দরবনের চাকের মধু',
    description: 'মধু, সুন্দরবনের চাকের মধু, আমাদের উৎপাদিত',
    price: 750,
    originalPrice: 900,
    image: '/src/assets/images/sundarban_honey_1782465914163.jpg',
    category: 'মধু',
    unit: '1 KG',
    stock: 15,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 64,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'm1',
    name: 'আম্রপালি আম',
    description: 'ফ্রেশ আম, আম্রপালি আম, আমাদের উৎপাদিত',
    price: 1560,
    image: '/src/assets/images/green_mangoes_1_1782466276525.jpg',
    category: 'ফ্রেশ আম',
    unit: '12 KG',
    stock: 50,
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 34,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'm2',
    name: 'গোপালভোগ আম',
    description: 'ফ্রেশ আম, গোপালভোগ আম, আমাদের উৎপাদিত',
    price: 1680,
    image: '/src/assets/images/green_mangoes_1_1782466276525.jpg',
    category: 'ফ্রেশ আম',
    unit: '12 KG',
    stock: 0,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 28,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'm3',
    name: 'গোবিন্দভোগ আম',
    description: 'ফ্রেশ আম, গোবিন্দভোগ আম, আমাদের উৎপাদিত',
    price: 1560,
    image: '/src/assets/images/green_mangoes_1_1782466276525.jpg',
    category: 'ফ্রেশ আম',
    unit: '12 KG',
    stock: 35,
    isFeatured: true,
    rating: 4.7,
    reviewsCount: 15,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'm4',
    name: 'ল্যাংড়া আম',
    description: 'ফ্রেশ আম, ল্যাংড়া আম, আমাদের উৎপাদিত',
    price: 1680,
    image: '/src/assets/images/green_mangoes_1_1782466276525.jpg',
    category: 'ফ্রেশ আম',
    unit: '12 KG',
    stock: 0,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 41,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'm5',
    name: 'হাড়িভাঙ্গা আম',
    description: 'ফ্রেশ আম, হাড়িভাঙ্গা আম, আমাদের উৎপাদিত',
    price: 1440,
    image: '/src/assets/images/green_mangoes_1_1782466276525.jpg',
    category: 'ফ্রেশ আম',
    unit: '12 KG',
    stock: 20,
    isFeatured: true,
    rating: 4.6,
    reviewsCount: 19,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'm6',
    name: 'হিমসাগর আম',
    description: 'ফ্রেশ আম, হিমসাগর আম, আমাদের উৎপাদিত',
    price: 1560,
    image: '/src/assets/images/green_mangoes_1_1782466276525.jpg',
    category: 'ফ্রেশ আম',
    unit: '12 KG',
    stock: 45,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 52,
    status: 'Active',
    sellerProductStatus: 'approved'
  },
  {
    id: 'd1',
    name: 'প্রিমিয়াম মরিয়ম খেজুর',
    description: 'খেজুর, প্রিমিয়াম মরিয়ম খেজুর, আমাদের আমদানিকৃত',
    price: 850,
    originalPrice: 1000,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
    category: 'খেজুর',
    unit: '1 KG',
    stock: 25,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 44,
    status: 'Active',
    sellerProductStatus: 'approved'
  }
];

export const INITIAL_USERS = [
  {
    id: 'U-581932',
    name: 'রফিক উল্লাহ',
    phone: '01712345678',
    password: 'password123',
    address: 'বাসা #১০, রোড #২, সেক্টর #৪',
    district: 'ঢাকা',
    area: 'উত্তরা',
    role: 'user',
    status: 'active',
    createdAt: '২৫ জুন, ২০২৬'
  },
  {
    id: 'U-392104',
    name: 'তাহমিনা বেগম',
    phone: '01876543210',
    password: 'password123',
    address: 'জিইসি মোড়, লালখান বাজার',
    district: 'চট্টগ্রাম',
    area: 'কোতোয়ালী',
    role: 'user',
    status: 'active',
    createdAt: '২৪ জুন, ২০২৬'
  },
  {
    id: 'U-130163',
    name: 'মেহেদী হাসান',
    phone: '01837587551',
    password: 'password123',
    address: 'শ্যামনগর, সাতক্ষীরা',
    district: 'সাতক্ষীরা',
    area: 'শ্যামনগর',
    role: 'admin',
    status: 'active',
    createdAt: '০১ জুলাই, ২০২৬'
  }
];

export const DEFAULT_SITE_CONFIG = {
  storeName: 'ম্যাংগো লাভার',
  storeSlogan: 'Pure & Organic Food',
  storeLogo: '/src/assets/images/mango_lover_logo_1782453485561.jpg',
  leftBannerImage: '/src/assets/images/mango_farmer_orchard_1782453455911.jpg',
  leftBannerTitle: 'আমবাগান থেকে সরাসরি আপনার দোরগোড়ায়',
  leftBannerSubtitle: 'সাতক্ষীরা ও শ্যামনগরের নিজস্ব বাগান থেকে কেমিক্যাল ছাড়া ফরমালিন মুক্ত একদম তাজা পাকা ও মিষ্টি আম সরবরাহ করছি।',
  leftBannerBtnText: 'Shop Now',
  leftBannerCategory: 'ফ্রেশ আম',
  rightBannerImage: '/src/assets/images/sundarban_honey_jar_1782453470122.jpg',
  rightBannerTitle: 'টাকা দিয়ে কিনবেন যেহেতু, খাঁটি-টাই নিন',
  rightBannerSubtitle: 'সুন্দরবনের খাঁটি মধু যা সরাসরি বন থেকে মৌয়ালদের সাহায্যে সংগ্রহ করা হয়। গুণগত মানে একদম খাঁটি।',
  rightBannerBtnText: 'Shop Now',
  rightBannerTagline: 'শতভাগ ন্যাচারাল হানি',
  rightBannerCategory: 'মধু',
  tickerItems: [
    '🚚 অগ্রীম ছাড়াই অর্ডার করতে পারবেন',
    '🛡️ ডেলিভারির সময় প্রোডাক্ট দেখে নিতে পারবেন',
    '🍯 সিজন ফ্রেশ সুন্দরবনের খাঁটি মধু চলে এসেছে',
    '📦 সারাদেশে ৩ দিনে দ্রুত হোম ডেলিভারি সুবিধা',
    '💯 শতভাগ ন্যাচারাল ও কেমিক্যালমুক্ত ফ্রেশ আম',
    '📞 যেকোনো প্রয়োজনে সরাসরি কল করুন আমাদের হটলাইনে'
  ],
  categoryImages: {},
  categoryBanners: {},
  categoryNames: {},
  aboutTitle: 'আমাদের সম্পর্কে?',
  aboutSubtitle: 'এই যে আপনি আজ আমাদের সম্পর্কে জানতে চাচ্ছেন, এই পথটা সহজ ছিল না। অনেক চড়াই-উতরাই পেরিয়ে আজকের অবস্থানে আপনাদের পছন্দের এই ম্যাংগো লাভার। আমাদের এই পথচলায় সকল প্রিয় গ্রাহক ও শুভাকাঙ্ক্ষীদের কাছে আমরা চিরকৃতজ্ঞ।',
  aboutOwnerImage: '/src/assets/images/mango_farmer_orchard_1782453455911.jpg',
  aboutHighlightText: 'নোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়ের পুষ্টি বিভাগ থেকে স্নাতক সম্পন্ন করা এক তরুণ - নাম তার মেহেদী হাসান',
  aboutParagraph1: 'যার শৈশব ও বেড়ে ওঠা নিভৃত পল্লীগাঁয়ে। উচ্চশিক্ষার উদ্দেশ্যে গ্রাম ছেড়ে তিনি পাড়ি জমান নোয়াখালীতে। সেখানে গিয়ে নিজের প্রয়োজনে কেনা খেজুরের গুড়, ঘি কিংবা আম - সবকিছুতেই কৃত্রিমতার ছাপ লক্ষ্য করেন। যেহেতু তার শৈশব কেটেছে গ্রামে, তাই খাঁটি খাদ্যদ্রব্য চিনতে তার ভুল হওয়ার কথা নয়; তার ওপর নিজের পড়াশোনাও ছিল \'নিরাপদ খাদ্য\' নিয়ে।',
  aboutParagraph2: 'ক্যাম্পাসে পরিচিতদের জন্য গুড় ও ঘি এনে প্রশংসা পাওয়ার পর তার মনে হয়েছিল—নিজে উদ্যোক্তা হয়ে দেশজুড়ে মানুষের কাছে খাঁটি খাদ্য পৌঁছে দিলে কেমন হয়? সেই ভাবনা থেকেই পরিবারের দেওয়া সামান্য আর্থিক পুঁজি নিয়ে তিনি এই সংকল্পে নামলেন যে - যতটুকু সম্ভব, ততটুকুই খাঁটি জিনিস তিনি গ্রাহকদের কাছে পৌঁছে দেবেন। অনেক নির্ঘুম রাত আর অক্লান্ত পরিশ্রমে তিনি নিজের প্রচেষ্টা অব্যাহত রেখে প্রমাণ করলেন যে, একাগ্রতা থাকলে সবই সম্ভব। কোনো কিছু অর্জন করতে হলে আগে সেটি ridicuলously মজবুতভাবে চাইতে হয়।',
  aboutParagraph3: 'পরবর্তীতে কয়েক লক্ষ গ্রাহকের দোরগোড়ায় তিনি পৌঁছে দিয়েছেন তার এই \'ম্যাংগো লাভার\'-এর পণ্য। তৈরি হয়েছে বিশাল এক অনুগত গ্রাহক শ্রেণি। সেই সঙ্গে নিরবিচ্ছিন্ন সেবা নিশ্চিত করতে তিনি গড়ে তুলেছেন দক্ষ সাপোর্ট টিম। আজ ৬০ জনেরও বেশি কর্মী নিয়ে তিনি সফলতার সাথে এগিয়ে যাচ্ছেন।',
  aboutFacebookLink: 'https://facebook.com',
  contactOffice: 'Shyamnagar, Satkhira, Bangladesh',
  contactPhone: '+880 1837-587551',
  contactEmail: 'info AT mangolover.com.bd',
  refundPolicyText: 'আমাদের মূল লক্ষ্য গ্রাহকের সন্তুষ্টি। যদি কোনো কারণে আপনি পণ্য পেয়ে অসन्तुষ্ট হন, তবে নিম্নলিখিত নীতি অনুযায়ী আমরা পণ্য পরিবর্তন বা মূল্য ফেরত দিয়ে থাকি:\n\n১. ডেলিভারির সময় পণ্য দেখে নেওয়ার সুযোগ রয়েছে। কোনো প্রকার ক্রটি থাকলে ডেলিভারি ম্যানের কাছেই ফেরত দিতে পারবেন।\n\n২. আমরা সাতক্ষীরা ও শ্যামনগর থেকে সরাসরি তাজা পণ্য পাঠাই। পরিবহণকালীন ক্ষয়ক্ষতির জন্য আমরা ১০০% দায়বদ্ধ।\n\n৩. রিটার্ন করার পর ৩ কার্যদিবসের মধ্যে আপনার বিকাশ/রকেট/নগদ অথবা ব্যাংক অ্যাকাউন্টে টাকা রিফান্ড করা হবে।',
  privacyPolicyText: 'আপনার গোপনীয়তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। ম্যাংগো লাভার গ্রাহকদের ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা নিশ্চিত করে:\n\n১. আমরা শুধুমাত্র অর্ডার প্রসেসিং এবং পণ্য ডেলিভারির সুবিধার্থে গ্রাহকের নাম, মোবাইল নম্বর এবং ঠিকানা সংগ্রহ করি।\n\n২. সংগৃহীত তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রয় বা হস্তান্তর করা হয় না।\n\n৩. আমাদের ওয়েবসাইট এবং গ্রাহক ডেটাবেজ সুরক্ষিত রাখতে আমরা আধুনিক সিকিউরিটি প্রোটোকল ব্যবহার করি।',
  coupons: [
    { code: 'MANGO10', type: 'percentage', value: 10 },
    { code: 'MANGO100', type: 'flat', value: 100 },
    { code: 'FREE50', type: 'flat', value: 50 }
  ],
  sellerSystemActive: true,
  allowAdminsToDeleteOrders: true,
  promoActive: false,
  promoImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80',
  promoLink: '',
  faqItems: [
    {
      question: 'আমের ডেলিভারি কীভাবে দেওয়া হয় এবং কতদিন সময় লাগে?',
      answer: 'আমরা নিজস্ব তত্ত্বাবধানে কুরিয়ারের মাধ্যমে অর্ডার পাওয়ার পর সাতক্ষীরা ও শ্যামনগরের বাগান থেকে সরাসরি তাজা আম পেড়ে সর্বোচ্চ ৩ দিনের মধ্যে দেশজুড়ে হোম ডেলিভারি নিশ্চিত করি।'
    },
    {
      question: 'আম কি সম্পূর্ণ কেমিক্যাল ও ফরমালিন মুক্ত?',
      answer: 'হ্যাঁ, ম্যাংগো লাভার-এর প্রতিটি আম সাতক্ষীরা ও শ্যামনগরের বাগান থেকে শতভাগ কেমিক্যাল ও ফরমালিন ছাড়াই প্রাকৃতিকভাবে পাকানো অবস্থায় গাছ থেকে পেড়ে সরাসরি পাঠানো হয়।'
    },
    {
      question: 'ডেলিভারি পাওয়ার পর আম বা অন্য পণ্য নষ্ট বের হলে কী করণীয়?',
      answer: 'ডেলিভারি পাওয়ার পর কোনো আম বা পণ্য নষ্ট বের হলে অনুগ্রহ করে আমাদের হটলাইনে (+৮৮০ ১৮৩৭-৫৮৭৫৫১) যোগাযোগ করুন অথবা ছবি তুলে জানান। আমরা নষ্ট হওয়া অংশের সমপরিমাণ রিফান্ড অথবা নতুন আম একদম ফ্রিতে পাঠিয়ে দেবো।'
    },
    {
      question: 'আপনাদের কি কোনো অফলাইন শোরুম আছে নাকি শুধু অনলাইনেই সার্ভিস দেন?',
      answer: 'আমাদের মূল বাগান ও সংগ্রহ কেন্দ্র সাতক্ষীরা ও শ্যামনগরে অবস্থিত। বর্তমানে আমরা শুধু অনলাইনের মাধ্যমে সরাসরি বাগান থেকে ফ্রেশ পণ্য গ্রাহকের দোরগোড়ায় পৌঁছে দেওয়ার সেবা দিয়ে আসছি।'
    }
  ],
  commissionPercentage: 10
};

export async function seedDatabase() {
  try {
    // 1. Categories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      await Category.insertMany(INITIAL_CATEGORIES as any);
      console.log("🌱 Seeded initial categories");
    }

    // 2. Products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany(INITIAL_PRODUCTS as any);
      console.log("🌱 Seeded initial products");
    }

    // 3. Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany(INITIAL_USERS as any);
      console.log("🌱 Seeded initial users");
    }

    // 4. Site Config
    const configCount = await SiteConfig.countDocuments();
    if (configCount === 0) {
      await SiteConfig.create(DEFAULT_SITE_CONFIG);
      console.log("🌱 Seeded initial site configuration");
    }
    
  } catch (err) {
    console.error("❌ Seeding database failed:", err);
  }
}
