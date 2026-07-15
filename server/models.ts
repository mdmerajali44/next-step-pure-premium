import mongoose, { Schema, Document } from "mongoose";

// --- USER SCHEMA ---
export interface IUserDocument extends Document {
  id: string; // Custom string ID for existing code compatibility
  name: string;
  phone: string;
  email?: string;
  password?: string;
  address?: string;
  district?: string;
  area?: string;
  dob?: string;
  gender?: string;
  createdAt: string;
  status: 'active' | 'blocked';
  role: 'user' | 'admin' | 'seller';
  permissions?: string[];
  shopName?: string;
  shopLogo?: string;
  shopDescription?: string;
  facebookPage?: string;
  contactPhone?: string;
  sellerStatus?: 'pending' | 'approved' | 'rejected';
  paymentMethod?: 'bkash' | 'nagad' | 'bank';
  paymentDetails?: string;
  balance?: number;
}

const UserSchema = new Schema<IUserDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, default: "" },
  address: { type: String },
  district: { type: String },
  area: { type: String },
  dob: { type: String },
  gender: { type: String },
  createdAt: { type: String, required: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  role: { type: String, enum: ['user', 'admin', 'seller'], default: 'user' },
  permissions: [{ type: String }],
  shopName: { type: String },
  shopLogo: { type: String },
  shopDescription: { type: String },
  facebookPage: { type: String },
  contactPhone: { type: String },
  sellerStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
  paymentMethod: { type: String, enum: ['bkash', 'nagad', 'bank'] },
  paymentDetails: { type: String },
  balance: { type: Number, default: 0 }
});

// --- PRODUCT SCHEMA ---
export interface IProductDocument extends Document {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  unit: string;
  stock: number;
  isFeatured?: boolean;
  rating: number;
  reviewsCount: number;
  sku?: string;
  sizes?: string[];
  sizePrices?: Record<string, { price: number; originalPrice?: number }>;
  reorderLevel?: number;
  addedBy?: string;
  status?: string;
  purchasePrice?: number;
  badge?: 'none' | 'new' | 'restocked';
  tagline?: string;
  detailedTitle?: string;
  descriptionBullets?: string[];
  manufacturer?: string;
  sourceArea?: string;
  shelfLife?: string;
  organicCertificate?: string;
  sellerId?: string;
  sellerName?: string;
  sellerProductStatus?: 'pending' | 'approved' | 'rejected';
}

const ProductSchema = new Schema<IProductDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  images: [{ type: String }],
  category: { type: String, required: true },
  unit: { type: String, required: true },
  stock: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 5 },
  reviewsCount: { type: Number, default: 0 },
  sku: { type: String },
  sizes: [{ type: String }],
  sizePrices: { type: Schema.Types.Mixed },
  reorderLevel: { type: Number },
  addedBy: { type: String },
  status: { type: String, default: 'Active' },
  purchasePrice: { type: Number },
  badge: { type: String, enum: ['none', 'new', 'restocked'], default: 'none' },
  tagline: { type: String },
  detailedTitle: { type: String },
  descriptionBullets: [{ type: String }],
  manufacturer: { type: String },
  sourceArea: { type: String },
  shelfLife: { type: String },
  organicCertificate: { type: String },
  sellerId: { type: String },
  sellerName: { type: String },
  sellerProductStatus: { type: String, enum: ['pending', 'approved', 'rejected'] }
});

// --- ORDER SCHEMA ---
export interface IOrderDocument extends Document {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  district?: string;
  area?: string;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket';
  bkashNumber?: string;
  trxId?: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    unit: string;
    image: string;
    sellerId?: string;
  }[];
  totalAmount: number;
  deliveryCharge: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  couponCode?: string;
  discountAmount?: number;
}

const OrderSchema = new Schema<IOrderDocument>({
  id: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  district: { type: String },
  area: { type: String },
  paymentMethod: { type: String, enum: ['cod', 'bkash', 'nagad', 'rocket'], required: true },
  bkashNumber: { type: String },
  trxId: { type: String },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    image: { type: String, required: true },
    sellerId: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  createdAt: { type: String, required: true },
  couponCode: { type: String },
  discountAmount: { type: Number }
});

// --- CATEGORY SCHEMA ---
export interface ICategoryDocument extends Document {
  id: string;
  name: string;
  slug: string;
  icon: string;
  showInNavbar?: boolean;
}

const CategorySchema = new Schema<ICategoryDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, required: true },
  showInNavbar: { type: Boolean, default: true }
});

// --- WITHDRAW REQUEST SCHEMA ---
export interface IWithdrawRequestDocument extends Document {
  id: string;
  sellerId: string;
  shopName: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'bank';
  details: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'rejected';
}

const WithdrawRequestSchema = new Schema<IWithdrawRequestDocument>({
  id: { type: String, required: true, unique: true },
  sellerId: { type: String, required: true },
  shopName: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['bkash', 'nagad', 'bank'], required: true },
  details: { type: String, required: true },
  createdAt: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' }
});

// --- PRODUCT REQUEST SCHEMA ---
export interface IProductRequestDocument extends Document {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  quantity: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'contacted';
}

const ProductRequestSchema = new Schema<IProductRequestDocument>({
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  quantity: { type: String, required: true },
  createdAt: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'contacted'], default: 'pending' }
});

// --- SITE CONFIG SCHEMA ---
export interface ISiteConfigDocument extends Document {
  storeName: string;
  storeSlogan: string;
  storeLogo: string;
  storeNameImage?: string;
  storeSloganImage?: string;
  
  leftBannerImage: string;
  leftBannerTitle: string;
  leftBannerSubtitle: string;
  leftBannerBtnText: string;
  leftBannerCategory: string;

  rightBannerImage: string;
  rightBannerTitle: string;
  rightBannerSubtitle: string;
  rightBannerBtnText: string;
  rightBannerTagline: string;
  rightBannerCategory: string;

  tickerItems: string[];

  categoryImages?: Record<string, string>;
  categoryBanners?: Record<string, string>;
  categoryNames?: Record<string, string>;

  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutOwnerImage?: string;
  aboutHighlightText?: string;
  aboutParagraph1?: string;
  aboutParagraph2?: string;
  aboutParagraph3?: string;
  aboutFacebookLink?: string;
  messengerLink?: string;
  facebookLink?: string;
  instagramLink?: string;
  youtubeLink?: string;

  borderWidth?: string;
  contactOffice?: string;
  contactPhone?: string;
  contactEmail?: string;
  googleMapUrl?: string;

  refundPolicyText?: string;
  privacyPolicyText?: string;
  coupons?: any[];
  promoActive?: boolean;
  promoImage?: string;
  promoLink?: string;
  faqItems?: { question: string; answer: string }[];
  sellerSystemActive?: boolean;
  commissionPercentage?: number;
  allowAdminsToDeleteOrders?: boolean;
}

const SiteConfigSchema = new Schema<ISiteConfigDocument>({
  storeName: { type: String, required: true },
  storeSlogan: { type: String, required: true },
  storeLogo: { type: String, required: true },
  storeNameImage: { type: String },
  storeSloganImage: { type: String },
  
  leftBannerImage: { type: String, required: true },
  leftBannerTitle: { type: String, required: true },
  leftBannerSubtitle: { type: String, required: true },
  leftBannerBtnText: { type: String, required: true },
  leftBannerCategory: { type: String, required: true },

  rightBannerImage: { type: String, required: true },
  rightBannerTitle: { type: String, required: true },
  rightBannerSubtitle: { type: String, required: true },
  rightBannerBtnText: { type: String, required: true },
  rightBannerTagline: { type: String, required: true },
  rightBannerCategory: { type: String, required: true },

  tickerItems: [{ type: String }],

  categoryImages: { type: Schema.Types.Mixed },
  categoryBanners: { type: Schema.Types.Mixed },
  categoryNames: { type: Schema.Types.Mixed },

  aboutTitle: { type: String },
  aboutSubtitle: { type: String },
  aboutOwnerImage: { type: String },
  aboutHighlightText: { type: String },
  aboutParagraph1: { type: String },
  aboutParagraph2: { type: String },
  aboutParagraph3: { type: String },
  aboutFacebookLink: { type: String },
  messengerLink: { type: String },
  facebookLink: { type: String },
  instagramLink: { type: String },
  youtubeLink: { type: String },

  borderWidth: { type: String },
  contactOffice: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String },
  googleMapUrl: { type: String },

  refundPolicyText: { type: String },
  privacyPolicyText: { type: String },
  coupons: [{ type: Schema.Types.Mixed }],
  promoActive: { type: Boolean },
  promoImage: { type: String },
  promoLink: { type: String },
  faqItems: [{ question: String, answer: String }],
  sellerSystemActive: { type: Boolean, default: true },
  commissionPercentage: { type: Number, default: 10 },
  allowAdminsToDeleteOrders: { type: Boolean, default: true }
});

// --- CHAT SESSION SCHEMA ---
export interface IChatSessionDocument extends Document {
  sessionId: string;
  customerName: string;
  messages: {
    id: string;
    sender: "user" | "bot" | "admin";
    text: string;
    timestamp: string;
  }[];
  lastUpdated: string;
  unreadByAdmin: boolean;
}

const ChatSessionSchema = new Schema<IChatSessionDocument>({
  sessionId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  messages: [{
    id: { type: String, required: true },
    sender: { type: String, enum: ["user", "bot", "admin"], required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true }
  }],
  lastUpdated: { type: String, required: true },
  unreadByAdmin: { type: Boolean, default: false }
});

// Compile and export Mongoose Models with automatic in-memory fallback
import { makeDynamicModelProxy } from "./fallbackStore";

const RawUser = (mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema)) as any;
const RawProduct = (mongoose.models.Product || mongoose.model<IProductDocument>("Product", ProductSchema)) as any;
const RawOrder = (mongoose.models.Order || mongoose.model<IOrderDocument>("Order", OrderSchema)) as any;
const RawCategory = (mongoose.models.Category || mongoose.model<ICategoryDocument>("Category", CategorySchema)) as any;
const RawSiteConfig = (mongoose.models.SiteConfig || mongoose.model<ISiteConfigDocument>("SiteConfig", SiteConfigSchema)) as any;
const RawWithdrawRequest = (mongoose.models.WithdrawRequest || mongoose.model<IWithdrawRequestDocument>("WithdrawRequest", WithdrawRequestSchema)) as any;
const RawProductRequest = (mongoose.models.ProductRequest || mongoose.model<IProductRequestDocument>("ProductRequest", ProductRequestSchema)) as any;
const RawChatSession = (mongoose.models.ChatSession || mongoose.model<IChatSessionDocument>("ChatSession", ChatSessionSchema)) as any;

export const User = makeDynamicModelProxy("User", RawUser);
export const Product = makeDynamicModelProxy("Product", RawProduct);
export const Order = makeDynamicModelProxy("Order", RawOrder);
export const Category = makeDynamicModelProxy("Category", RawCategory);
export const SiteConfig = makeDynamicModelProxy("SiteConfig", RawSiteConfig);
export const WithdrawRequest = makeDynamicModelProxy("WithdrawRequest", RawWithdrawRequest);
export const ProductRequest = makeDynamicModelProxy("ProductRequest", RawProductRequest);
export const ChatSession = makeDynamicModelProxy("ChatSession", RawChatSession);

