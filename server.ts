import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { connectDB } from "./server/db";
import { 
  seedDatabase, 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_USERS, 
  DEFAULT_SITE_CONFIG 
} from "./server/seed";
import { populateFallbackStore } from "./server/fallbackStore";
import { 
  User, 
  Product, 
  Order, 
  Category, 
  SiteConfig, 
  WithdrawRequest, 
  ProductRequest, 
  ChatSession 
} from "./server/models";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Always populate fallback store first so the app is immediately active offline/fallback
  populateFallbackStore(
    INITIAL_CATEGORIES,
    INITIAL_PRODUCTS,
    INITIAL_USERS,
    DEFAULT_SITE_CONFIG
  );

  // Initialize MongoDB Atlas
  const isDbConnected = await connectDB();
  if (isDbConnected) {
    await seedDatabase();
  }


  // Middleware
  app.use(cors({
    origin: "*", // Allows any frontend to request API, essential for hosting on Render
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.use(express.json({ limit: "15mb" }));

  // --- API ROUTES ---

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: isDbConnected ? "connected" : "disconnected" });
  });

  // 2. Authentication APIs
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { id, name, phone, password, role, ...extra } = req.body;
      if (!name || !phone || !password) {
        return res.status(400).json({ error: "Name, phone, and password are required." });
      }

      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ error: "এই ফোন নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে।" });
      }

      const newUser = await User.create({
        id: id || ('U-' + Math.floor(100000 + Math.random() * 900000)),
        name,
        phone,
        password, // stored plain text / secure hash as used in existing client code
        role: role || "user",
        createdAt: new Date().toLocaleDateString("bn-BD"),
        status: "active",
        ...extra
      });

      res.status(201).json({ success: true, user: newUser });
    } catch (err: any) {
      console.error("Register error:", err);
      res.status(500).json({ error: "নিবন্ধন করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ error: "Phone and password are required." });
      }

      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(401).json({ error: "ভুল মোবাইল নম্বর বা পাসওয়ার্ড।" });
      }

      if (user.status === "blocked") {
        return res.status(403).json({ error: "আপনার অ্যাকাউন্টটি ব্লক করা রয়েছে। দয়া করে এডমিনের সাথে যোগাযোগ করুন।" });
      }

      if (user.password !== password) {
        return res.status(401).json({ error: "ভুল মোবাইল নম্বর বা পাসওয়ার্ড।" });
      }

      res.json({ success: true, user });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "লগইন ব্যর্থ হয়েছে।" });
    }
  });

  app.get("/api/auth/users", async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "ইউজারদের তথ্য লোড করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.put("/api/auth/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = await User.findOneAndUpdate({ id }, req.body, { new: true });
      if (!updatedUser) {
        return res.status(404).json({ error: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।" });
      }
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ error: "ব্যবহারকারীর তথ্য আপডেট করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.delete("/api/auth/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deletedUser = await User.findOneAndDelete({ id });
      if (!deletedUser) {
        return res.status(404).json({ error: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।" });
      }
      res.json({ success: true, message: "ব্যবহারকারী সফলভাবে মুছে ফেলা হয়েছে।" });
    } catch (err) {
      res.status(500).json({ error: "ব্যবহারকারী ডিলিট করতে ব্যর্থ হয়েছে।" });
    }
  });

  // 3. Products APIs
  app.get("/api/products", async (req, res) => {
    try {
      const products = await Product.find();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: "পণ্যসমূহ লোড করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = req.body;
      if (!productData.id) {
        productData.id = 'p-' + Math.random().toString(36).substring(2, 9);
      }
      const newProduct = await Product.create(productData);
      res.status(201).json(newProduct);
    } catch (err) {
      console.error("Create product error:", err);
      res.status(500).json({ error: "পণ্য যোগ করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedProduct = await Product.findOneAndUpdate({ id }, req.body, { new: true });
      if (!updatedProduct) {
        return res.status(404).json({ error: "পণ্যটি খুঁজে পাওয়া যায়নি।" });
      }
      res.json(updatedProduct);
    } catch (err) {
      res.status(500).json({ error: "পণ্য আপডেট করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deletedProduct = await Product.findOneAndDelete({ id });
      if (!deletedProduct) {
        return res.status(404).json({ error: "পণ্যটি খুঁজে পাওয়া যায়নি।" });
      }
      res.json({ success: true, message: "পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।" });
    } catch (err) {
      res.status(500).json({ error: "পণ্য ডিলিট করতে ব্যর্থ হয়েছে।" });
    }
  });

  // 4. Categories APIs
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: "ক্যাটাগরি সমূহ লোড করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = req.body;
      if (!categoryData.id) {
        categoryData.id = 'cat-' + Math.random().toString(36).substring(2, 9);
      }
      const newCategory = await Category.create(categoryData);
      res.status(201).json(newCategory);
    } catch (err) {
      res.status(500).json({ error: "ক্যাটাগরি তৈরি করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedCategory = await Category.findOneAndUpdate({ id }, req.body, { new: true });
      if (!updatedCategory) {
        return res.status(404).json({ error: "ক্যাটাগরি খুঁজে পাওয়া যায়নি।" });
      }
      res.json(updatedCategory);
    } catch (err) {
      res.status(500).json({ error: "ক্যাটাগরি আপডেট করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCategory = await Category.findOneAndDelete({ id });
      if (!deletedCategory) {
        return res.status(404).json({ error: "ক্যাটাগরি খুঁজে পাওয়া যায়নি।" });
      }
      res.json({ success: true, message: "ক্যাটাগরি মুছে ফেলা হয়েছে।" });
    } catch (err) {
      res.status(500).json({ error: "ক্যাটাগরি ডিলিট করতে ব্যর্থ হয়েছে।" });
    }
  });

  // 5. Orders APIs
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "অর্ডার সমূহ লোড করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = req.body;
      if (!orderData.id) {
        orderData.id = 'ML-' + Math.floor(100000 + Math.random() * 900000);
      }
      
      // Idempotency: check if an order with this ID already exists
      const existingOrder = await Order.findOne({ id: orderData.id });
      if (existingOrder) {
        return res.status(200).json(existingOrder);
      }

      if (!orderData.createdAt) {
        orderData.createdAt = new Date().toLocaleDateString("bn-BD") + " " + new Date().toLocaleTimeString("bn-BD");
      }
      const newOrder = await Order.create(orderData);
      res.status(201).json(newOrder);
    } catch (err) {
      console.error("Create order error:", err);
      res.status(500).json({ error: "অর্ডার করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedOrder = await Order.findOneAndUpdate({ id }, req.body, { new: true });
      if (!updatedOrder) {
        return res.status(404).json({ error: "অর্ডারটি খুঁজে পাওয়া যায়নি।" });
      }
      res.json(updatedOrder);
    } catch (err) {
      res.status(500).json({ error: "অর্ডার স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Extract details about the requester
      const requesterPhone = req.headers['x-requester-phone'] || req.query.phone;
      const requesterRole = req.headers['x-requester-role'] || req.query.role;

      // Find the site config
      const config = await SiteConfig.findOne();
      if (config && config.allowAdminsToDeleteOrders === false) {
        // Super Admin identifier checks
        const isSuperAdmin = 
          requesterPhone === '01837587551' || 
          requesterRole === 'super_admin';

        if (!isSuperAdmin) {
          return res.status(403).json({ error: "দুঃখিত, শুধুমাত্র সুপার অ্যাডমিন অর্ডার ডিলিট করতে পারবেন।" });
        }
      }

      const result = await Order.findOneAndDelete({ id });
      if (!result) {
        return res.status(404).json({ error: "অর্ডারটি খুঁজে পাওয়া যায়নি।" });
      }
      res.json({ success: true, message: "অর্ডারটি মুছে ফেলা হয়েছে।" });
    } catch (err) {
      console.error("Delete order error:", err);
      res.status(500).json({ error: "অর্ডার মুছে ফেলতে ব্যর্থ হয়েছে।" });
    }
  });

  // 6. Withdraw Request APIs
  app.get("/api/withdraws", async (req, res) => {
    try {
      const withdraws = await WithdrawRequest.find().sort({ createdAt: -1 });
      res.json(withdraws);
    } catch (err) {
      res.status(500).json({ error: "টাকা তোলার রিকোয়েস্ট লোড করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/withdraws", async (req, res) => {
    try {
      const requestData = req.body;
      if (!requestData.id) {
        requestData.id = 'WR-' + Math.floor(100000 + Math.random() * 900000);
      }
      const newRequest = await WithdrawRequest.create(requestData);
      res.status(201).json(newRequest);
    } catch (err) {
      res.status(500).json({ error: "রিকোয়েস্ট করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.put("/api/withdraws/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRequest = await WithdrawRequest.findOneAndUpdate({ id }, req.body, { new: true });
      if (!updatedRequest) {
        return res.status(404).json({ error: "রিকোয়েস্ট খুঁজে পাওয়া যায়নি।" });
      }
      res.json(updatedRequest);
    } catch (err) {
      res.status(500).json({ error: "রিকোয়েস্ট আপডেট করতে ব্যর্থ হয়েছে।" });
    }
  });

  // 7. Custom Product Request APIs
  app.get("/api/product-requests", async (req, res) => {
    try {
      const requests = await ProductRequest.find().sort({ createdAt: -1 });
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: "অনুরোধ সমূহ লোড করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/product-requests", async (req, res) => {
    try {
      const requestData = req.body;
      if (!requestData.id) {
        requestData.id = 'PR-' + Math.floor(100000 + Math.random() * 900000);
      }
      const newRequest = await ProductRequest.create(requestData);
      res.status(201).json(newRequest);
    } catch (err) {
      res.status(500).json({ error: "অনুরোধ করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.put("/api/product-requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRequest = await ProductRequest.findOneAndUpdate({ id }, req.body, { new: true });
      if (!updatedRequest) {
        return res.status(404).json({ error: "অনুরোধ খুঁজে পাওয়া যায়নি।" });
      }
      res.json(updatedRequest);
    } catch (err) {
      res.status(500).json({ error: "অনুরোধ আপডেট করতে ব্যর্থ হয়েছে।" });
    }
  });

  // 8. Site Config APIs
  app.get("/api/siteconfig", async (req, res) => {
    try {
      const config = await SiteConfig.findOne();
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: "সাইট কনফিগারেশন লোড করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/siteconfig", async (req, res) => {
    try {
      const existing = await SiteConfig.findOne();
      let updated;
      if (existing) {
        updated = await SiteConfig.findOneAndUpdate({}, req.body, { new: true });
      } else {
        updated = await SiteConfig.create(req.body);
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "সাইট কনফিগারেশন সংরক্ষণ করতে ব্যর্থ হয়েছে।" });
    }
  });

  // 9. Live Chat APIs backed by MongoDB
  app.get("/api/chat/sync", async (req, res) => {
    try {
      const { sessionId } = req.query;
      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({ error: "sessionId is required" });
      }
      const session = await ChatSession.findOne({ sessionId });
      if (!session) {
        return res.json({ messages: [] });
      }
      res.json({ messages: session.messages });
    } catch (err) {
      res.status(500).json({ error: "চ্যাট সিনক্রোনাইজ করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.get("/api/admin/chats", async (req, res) => {
    try {
      const chatList = await ChatSession.find().sort({ lastUpdated: -1 });
      res.json(chatList);
    } catch (err) {
      res.status(500).json({ error: "চ্যাটসমূহ লোড করতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/admin/chats/reply", async (req, res) => {
    try {
      const { sessionId, text } = req.body;
      if (!sessionId || !text) {
        return res.status(400).json({ error: "sessionId and text are required" });
      }
      
      const adminMsg = {
        id: Math.random().toString(36).substring(7),
        sender: "admin" as const,
        text,
        timestamp: new Date().toISOString()
      };

      const session = await ChatSession.findOneAndUpdate(
        { sessionId },
        { 
          $push: { messages: adminMsg },
          $set: { lastUpdated: new Date().toISOString(), unreadByAdmin: false }
        },
        { new: true }
      );

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true, message: adminMsg });
    } catch (err) {
      res.status(500).json({ error: "উত্তর পাঠাতে ব্যর্থ হয়েছে।" });
    }
  });

  app.post("/api/admin/chats/read", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }
      await ChatSession.findOneAndUpdate({ sessionId }, { unreadByAdmin: false });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে।" });
    }
  });

  // AI Chat endpoint with Session tracking
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId, customerName, siteConfig, products, image, imageMimeType } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const activeSessionId = sessionId || "default-session";
      const activeCustomerName = customerName || `কাস্টমার #${activeSessionId.substring(0, 5)}`;

      const storeName = siteConfig?.storeName || "ম্যাংগো লাভার";
      const contactPhone = siteConfig?.contactPhone || "+880 1837-587551";
      const contactOffice = siteConfig?.contactOffice || "Shyamnagar, Satkhira, Bangladesh";
      const contactEmail = siteConfig?.contactEmail || "info@mangolover.com.bd";

      const fallbackReply = `আসসালামু আলাইকুম! আমাদের সাথে যোগাযোগের জন্য ধন্যবাদ। আমাদের একজন প্রতিনিধি খুব শীঘ্রই আপনার সাথে যোগাযোগ করবেন। জরুরী প্রয়োজনে আমাদের কাস্টমার কেয়ার নম্বরে কল করুন: ${contactPhone}।`;

      // Find or create chat session in MongoDB
      let session = await ChatSession.findOne({ sessionId: activeSessionId });
      if (!session) {
        session = await ChatSession.create({
          sessionId: activeSessionId,
          customerName: activeCustomerName,
          messages: [
            {
              id: "welcome",
              sender: "bot",
              text: `আসসালামু আলাইকুম! ${storeName}-এ আপনাকে স্বাগতম। আমি আপনার এআই সহকারী। সাতক্ষীরা ও শ্যামনগরের বাগান থেকে সরাসরি আম, মধু, ঘি, খেজুর সহ যেকোনো পণ্য, আমাদের শপ বা ডেলিভারি চার্জ সম্পর্কে যেকোনো প্রশ্ন করতে পারেন!`,
              timestamp: new Date().toISOString(),
            }
          ],
          lastUpdated: new Date().toISOString(),
          unreadByAdmin: false,
        });
      }

      // Append user message
      const userMsg = {
        id: Math.random().toString(36).substring(7),
        sender: "user" as const,
        text: message,
        timestamp: new Date().toISOString(),
      };
      
      session.messages.push(userMsg);
      session.lastUpdated = new Date().toISOString();
      session.unreadByAdmin = true;

      // Save user message
      await session.save();

      // Initialize Gemini safely
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // High quality offline fallback system using siteConfig and products data
        let replyText = "";
        const cleanMsg = message.toLowerCase();
        
        const isGeneralProductsInquiry = cleanMsg.includes("পণ্য") || cleanMsg.includes("প্রোডাক্ট") || cleanMsg.includes("আইটেম") || cleanMsg.includes("খাবার") || cleanMsg.includes("আছে কি") ||
          cleanMsg.includes("ponno") || cleanMsg.includes("purno") || cleanMsg.includes("product") || cleanMsg.includes("poduct") || cleanMsg.includes("item") || cleanMsg.includes("khabar") || cleanMsg.includes("habar") || cleanMsg.includes("kabar") ||
          (cleanMsg.includes("কি কি") && !(cleanMsg.includes("আম") || cleanMsg.includes("মধু") || cleanMsg.includes("ঘি") || cleanMsg.includes("তেল") || cleanMsg.includes("খেজুর") || cleanMsg.includes("সেমাই") || cleanMsg.includes("চিনি") || cleanMsg.includes("গুড়"))) ||
          ((cleanMsg.includes("ki ki") || cleanMsg.includes("kiki")) && !(cleanMsg.includes("aam") || cleanMsg.includes("mango") || cleanMsg.includes("modhu") || cleanMsg.includes("honey") || cleanMsg.includes("ghi") || cleanMsg.includes("ghee") || cleanMsg.includes("tel") || cleanMsg.includes("oil") || cleanMsg.includes("khejur") || cleanMsg.includes("date") || cleanMsg.includes("semai") || cleanMsg.includes("chini") || cleanMsg.includes("sugar") || cleanMsg.includes("gur") || cleanMsg.includes("jaggery")));
        
        const isPriceInquiry = cleanMsg.includes("দাম") || cleanMsg.includes("প্রাইস") || cleanMsg.includes("টাকা") || cleanMsg.includes("কত") ||
          cleanMsg.includes("dam") || cleanMsg.includes("price") || cleanMsg.includes("taka") || cleanMsg.includes("koto") || cleanMsg.includes("rate");

        const isDeliveryInquiry = cleanMsg.includes("ডেলিভারি") || cleanMsg.includes("চার্জ") || cleanMsg.includes("ডেলিভারি চার্জ") || cleanMsg.includes("পাঠা") || cleanMsg.includes("পৌছ") ||
          cleanMsg.includes("delivery") || cleanMsg.includes("charge") || cleanMsg.includes("ship") || cleanMsg.includes("pata") || cleanMsg.includes("patha") || cleanMsg.includes("poch");

        const isContactInquiry = cleanMsg.includes("ঠিকানা") || cleanMsg.includes("অফিস") || cleanMsg.includes("কোথায়") || cleanMsg.includes("যোগাযোগ") || cleanMsg.includes("নাম্বার") || cleanMsg.includes("ফোন") || cleanMsg.includes("কল") ||
          cleanMsg.includes("thikana") || cleanMsg.includes("address") || cleanMsg.includes("kothay") || cleanMsg.includes("jogajog") || cleanMsg.includes("number") || cleanMsg.includes("phone") || cleanMsg.includes("call") || cleanMsg.includes("mobile") || cleanMsg.includes("contract");

        const isRefundInquiry = cleanMsg.includes("রিফান্ড") || cleanMsg.includes("ফেরত") || cleanMsg.includes("রিটার্ন") || cleanMsg.includes("নীতি") ||
          cleanMsg.includes("refund") || cleanMsg.includes("ferot") || cleanMsg.includes("return") || cleanMsg.includes("policy");

        const isAboutInquiry = cleanMsg.includes("সম্পর্কে") || cleanMsg.includes("শপ") || cleanMsg.includes("কেমন") || cleanMsg.includes("ম্যাংগো লাভার") ||
          cleanMsg.includes("somporke") || cleanMsg.includes("about") || cleanMsg.includes("shop") || cleanMsg.includes("shopp") || cleanMsg.includes("mango lover");

        const isGreetingInquiry = cleanMsg.includes("হ্যালো") || cleanMsg.includes("hello") || cleanMsg.includes("hi") || cleanMsg.includes("হাই") || cleanMsg.includes("কেমন আছেন") || cleanMsg.includes("সালাম") || cleanMsg.includes("আসসালামু আলাইকুম") || cleanMsg.includes("আসসালামুআলাইকুম") ||
          cleanMsg.includes("salam") || cleanMsg.includes("slm") || cleanMsg.includes("hlw") || cleanMsg.includes("helo") || cleanMsg.includes("assalamualaikum") || cleanMsg.includes("kemon aso") || cleanMsg.includes("kemon achen") || cleanMsg.includes("kemon asen") || cleanMsg.includes("valoni") || cleanMsg.includes("valo");

        const fallbackProductsList = Array.isArray(products) ? products : [];
        let matchedCategoryKeyword = "";
        let matchedCategoryLabel = "";
        const catMap: Record<string, string[]> = {
          "আম": ["আম", "aam", "mango"],
          "মধু": ["মধু", "modhu", "honey"],
          "ঘি": ["ঘি", "ghee", "ghi"],
          "তেল": ["তেল", "oil", "tel"],
          "খেজুর": ["খেজুর", "date", "khejur"],
          "সেমাই": ["সেমাই", "semai"],
          "চিনি": ["চিনি", "chini", "sugar"],
          "গুড়": ["গুড়", "gur", "jaggery"]
        };
        for (const [label, keys] of Object.entries(catMap)) {
          if (keys.some(k => cleanMsg.includes(k))) {
            matchedCategoryKeyword = keys[0];
            matchedCategoryLabel = label;
            break;
          }
        }

        if (isGeneralProductsInquiry) {
          if (fallbackProductsList.length > 0) {
            const grouped: Record<string, typeof fallbackProductsList> = {};
            fallbackProductsList.forEach(p => {
              if (!grouped[p.category]) grouped[p.category] = [];
              grouped[p.category].push(p);
            });

            replyText = `আসসালামু আলাইকুম! আমাদের ${storeName}-এ চমৎকার সব অর্গানিক ও ফ্রেশ খাবার পাওয়া যায়। আমাদের বর্তমান প্রোডাক্ট লিস্ট নিচে দেওয়া হলো:\n\n`;
            for (const [catName, prodList] of Object.entries(grouped)) {
              replyText += `📁 **${catName}**:\n`;
              prodList.forEach(p => {
                replyText += `  - ✨ **${p.name}**\n`;
              });
              replyText += `\n`;
            }
            replyText += `\nআপনি আমাদের কোন পণ্যটি সম্পর্কে জানতে আগ্রহী? অনুগ্রহ করে জানালে আমি আপনাকে সেই পণ্যের পুষ্টিগুণ ও উপকারিতা সহ বিস্তারিত তথ্য দিতে পারব!`;
          } else {
            replyText = `আসসালামু আলাইকুম! আমাদের ${storeName}-এ চমৎকার সব অর্গানিক ও ফ্রেশ আম, মধু, ঘি, তেল, খেজুর এবং সেমাই পাওয়া যায়। আপনি নির্দিষ্ট কোনো ক্যাটাগরি বা পণ্যের উপকারিতা সম্পর্কে জানতে চাইলে আমাকে বলতে পারেন!`;
          }
        } 
        else if (isPriceInquiry) {
          let foundProduct = null;
          if (fallbackProductsList.length > 0) {
            for (const p of fallbackProductsList) {
              const cleanProdName = p.name.toLowerCase();
              if (cleanMsg.includes(cleanProdName) || cleanProdName.split(" ").some(word => word.length > 2 && cleanMsg.includes(word))) {
                foundProduct = p;
                break;
              }
            }
          }
          
          if (foundProduct) {
            replyText = `আমাদের **${foundProduct.name}** সাতক্ষীরা ও শ্যামনগরের ঐতিহ্যবাহী বাগান থেকে সরাসরি সংগ্রহ করা হয়। এটি অত্যন্ত সুস্বাদু ও পুষ্টিকর। \n\n💰 এর বর্তমান মূল্য: **${foundProduct.price} টাকা** (${foundProduct.unit || "১ কেজি"})।\n\nআপনি কি এটি অর্ডার করতে চান?`;
          } else if (matchedCategoryKeyword) {
            const matchedProducts = fallbackProductsList.filter(p => p.category.toLowerCase().includes(matchedCategoryKeyword) || p.name.toLowerCase().includes(matchedCategoryKeyword) || p.category.includes(matchedCategoryLabel) || p.name.includes(matchedCategoryLabel));
            if (matchedProducts.length > 0) {
              replyText = `আমাদের কাছে অত্যন্ত সুস্বাদু ও পুষ্টিকর **${matchedCategoryLabel}** আইটেমগুলো পাওয়া যাচ্ছে। এগুলোর অফার মূল্য নিচে দেওয়া হলো:\n\n` +
                matchedProducts.map(p => `✨ **${p.name}** (${p.unit || "১টি"}): **${p.price} টাকা**`).join("\n") +
                `\n\nআপনি কি সরাসরি অর্ডার করতে চান?`;
            } else {
              replyText = `আমাদের কাছে বর্তমানে এই মুহূর্তে কোনো ${matchedCategoryLabel} স্টক নেই। তবে খুব শীঘ্রই স্টক চলে আসবে ইনশাআল্লাহ।`;
            }
          } else {
            const featuredList = fallbackProductsList.slice(0, 4);
            if (featuredList.length > 0) {
              replyText = `আমাদের সাতক্ষীরা ও শ্যামনগরের নিজস্ব বাগান এবং বিশ্বস্ত উৎস থেকে সংগৃহীত সেরা পণ্যগুলোর দাম ও অফার নিচে দেওয়া হলো:\n\n` +
                featuredList.map(p => `✨ **${p.name}** (${p.unit || "১টি"}): **${p.price} টাকা**`).join("\n") +
                `\n\nআপনি নির্দিষ্ট কোনো পণ্যটির দাম জানতে চাচ্ছেন, অনুগ্রহ করে পণ্যটির নাম বলুন, আমি আপনাকে দামটি জানিয়ে দেব।`;
            } else {
              replyText = `আপনি কি আমাদের কোনো নির্দিষ্ট পণ্যের দাম জানতে চাচ্ছেন? অনুগ্রহ করে নির্দিষ্ট পণ্যটির সঠিক নাম বলুন (যেমন: "হিমসাগর আমের দাম কত?" বা "সুন্দরবনের মধুর দাম কত?"), আমি আপনাকে সঠিক দামটি জানিয়ে দেব।`;
            }
          }
        }
        else if (matchedCategoryKeyword) {
          const matchedProducts = fallbackProductsList.filter(p => p.category.toLowerCase().includes(matchedCategoryKeyword) || p.name.toLowerCase().includes(matchedCategoryKeyword) || p.category.includes(matchedCategoryLabel) || p.name.includes(matchedCategoryLabel));
              
          if (matchedProducts.length > 0) {
            replyText = `আমাদের স্পেশাল **${matchedCategoryLabel}** আইটেমগুলো সাতক্ষীরা ও শ্যামনগরের বাগান থেকে সরাসরি তাজা সংগ্রহ করা হয়। এগুলো অত্যন্ত সুস্বাদু এবং শতভাগ নিরাপদ:\n\n` +
              matchedProducts.map(p => `✨ **${p.name}**`).join("\n") +
              `\n\nআপনি কি এগুলোর পুষ্টিগুণ বা উপকারিতা সম্পর্কে জানতে চান? অনুগ্রহ করে বলুন!`;
          } else {
            replyText = `আমাদের কাছে বর্তমানে এই মুহূর্তে কোনো ${matchedCategoryLabel} স্টক নেই। তবে খুব শীঘ্রই স্টক চলে আসবে ইনশাআল্লাহ।`;
          }
        } 
        else if (isDeliveryInquiry) {
          replyText = `আমরা সরাসরি সাতক্ষীরা ও শ্যামনগর থেকে শতভাগ খাঁটি ও নিরাপদ পণ্য পাঠাই। পরিবহণকালীন যেকোনো ক্ষয়ক্ষতির জন্য আমরা ১০০% দায়বদ্ধ। ডেলিভারির সময় আপনি পণ্য দেখে বুঝে নিতে পারবেন।`;
        } else if (isContactInquiry) {
          replyText = `আমাদের যোগাযোগের ঠিকানা:\n📍 ঠিকানা: ${contactOffice}\n📞 ফোন নম্বর: ${contactPhone}\n✉️ ইমেইল: ${contactEmail}`;
        } else if (isRefundInquiry) {
          replyText = siteConfig?.refundPolicyText || `আমরা সাতক্ষীরা ও শ্যামনগর থেকে সরাসরি তাজা পণ্য পাঠাই। পরিবহণকালীন ক্ষয়ক্ষতির জন্য আমরা ১০০% দায়বদ্ধ। ডেলিভারির সময় পণ্য দেখে নিতে পারবেন।`;
        } else if (isAboutInquiry) {
          replyText = `${storeName} - ${siteConfig?.storeSlogan || "শতভাগ খাঁটি ও নিরাপদ অর্গানিক ফুড"}। ${siteConfig?.aboutTitle || "আমাদের সম্পর্কে"}: ${siteConfig?.aboutHighlightText || ""} ${siteConfig?.aboutParagraph1 || ""}`;
        } else if (isGreetingInquiry) {
          replyText = `আসসালামু আলাইকুম! ${storeName} অ্যাসিস্ট্যান্ট হিসেবে আপনাকে স্বাগত জানাচ্ছি। আমি আপনার সাহায্যকারী এআই সহকারী। সাতক্ষীরা ও শ্যামনগরের আম ও অন্যান্য সুস্বাদু পণ্য, ডেলিভারি চার্জ বা যেকোনো কিছু সম্পর্কে জানতে আমাকে প্রশ্ন করতে পারেন!`;
        } else {
          replyText = fallbackReply;
        }

        const botMsg = {
          id: Math.random().toString(36).substring(7),
          sender: "bot" as const,
          text: replyText,
          timestamp: new Date().toISOString(),
        };

        session.messages.push(botMsg);
        session.lastUpdated = new Date().toISOString();
        await session.save();

        return res.json({ reply: replyText });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const sysInstruction = `
You are the official AI Live Chat Assistant of the online shop "${storeName}". 
Your name is "Mango Lover Assistant". You must converse politely, warm, and strictly in Bengali.

CRITICAL INSTRUCTION ON USER INPUTS:
- The user may type their message in standard Bengali script OR in Banglish (Bengali written with the English alphabet, e.g., "apnadr thikana ki?", "dam koto?", "delivery fee koto?", "khejur ache?", "hello kemon achen?").
- You must perfectly comprehend and understand their Banglish messages as if they were written in pure Bengali.
- Keep your replies polite, warm, helpful, and written in elegant, readable Bengali (standard script), formatted with bullet points and friendly emojis.

Here is the current, up-to-date information of the website:
---
Store Name: ${storeName}
Slogan: ${siteConfig?.storeSlogan || "শতভাগ খাঁটি ও নিরাপদ অর্গানিক ফুড"}
About Us Section:
- Title: ${siteConfig?.aboutTitle || "আমাদের সম্পর্কে?"}
- Subtitle: ${siteConfig?.aboutSubtitle || ""}
- Highlight: ${siteConfig?.aboutHighlightText || ""}
- Story Detailed: ${siteConfig?.aboutParagraph1 || ""} ${siteConfig?.aboutParagraph2 || ""} ${siteConfig?.aboutParagraph3 || ""}

Contact Details:
- Address: ${contactOffice}
- Phone Number: ${contactPhone} (হটলাইন)
- Email: ${contactEmail}

Policies:
- Refund & Return Policy: ${siteConfig?.refundPolicyText || "আমরা সাতক্ষীরা ও শ্যামনগর থেকে সরাসরি তাজা পণ্য পাঠাই। পরিবহণকালীন ক্ষয়ক্ষতির জন্য আমরা ১০০% দায়বদ্ধ। ডেলিভারির সময় পণ্য দেখে নিতে পারবেন।"}
- Privacy Policy: ${siteConfig?.privacyPolicyText || "আমরা শুধুমাত্র অর্ডার প্রসেসিং এবং পণ্য ডেলিভারির সুবিধার্থে গ্রাহকের নাম, মোবাইল নম্বর এবং ঠিকানা সংগ্রহ করি।"}

Available Products in Store:
${
  Array.isArray(products)
    ? products
        .map(
          (p) =>
            `- Product Name: "${p.name}", Category is "${p.category}", Main Price is ${p.price} BDT (Sizes/Weight Options: ${
              p.options?.map((o: any) => `${o.name} - ${o.price} BDT`).join(", ") || "None"
            }), Description: ${p.description || "N/A"}`
        )
        .join("\n")
    : "No products currently listed."
}
---

CRITICAL PRODUCT PRESENTATION & RESPONSE RULES:
1. Do NOT mention product prices unless explicitly asked:
   - Unless the user directly asks for the price (e.g., "দাম কত", "প্রাইস কত", "কত টাকা", "rate koto" or equivalent in Banglish), you MUST NOT mention the price of any product.
   - If the user asks about available products, categories, or options (e.g. "কি কি আম আছে?" or "কি কি প্রোডাক্ট আছে?"), list the products with their names, descriptions, and weight options, but do NOT include their prices.
   
2. If and only if the user asks for prices:
   - Provide the exact prices of the product(s) being discussed. Specify BDT/টাকা clearly.
   - If they ask "দাম কত" or "প্রাইস কত" without naming any product, politely ask which product they are interested in, and do not proactively list prices of other products.

3. Location & Source:
   - Our main location and source of products is Satkhira (সাতক্ষীরা) and Shyamnagar (শ্যামনগর). Ensure you represent our brand as authentic Satkhira organic producers. All our products are sourced directly from Satkhira and Shyamnagar orchards and local fields.

4. Style and Tone:
   - Speak strictly in polite, warm, and professional Bengali (বাংলা). Start with a beautiful greeting like "আসসালামু আলাইকুম! আশা করি ভালো আছেন।" or similar when appropriate.
   - Use beautiful emojis (like 🥭, 🍯, 📦, 📁, ✨, 💰) and structured bullet points to make the messages easy to read.

5. Handling Unrelated/Off-topic Questions:
   - If and only if the user asks a question that is COMPLETELY unrelated to this shop, its products, organic foods, ordering, delivery, shipping, policies, or contact details (e.g. "write code", "solve math", "discuss football"), you MUST output exactly this text and absolutely nothing else:
   "\${fallbackReply}"
`;

      const contents = [];
      const contextMessages = session.messages.slice(-8); // last 8 messages
      for (const msg of contextMessages) {
        if (msg.id === "welcome") continue;
        if (msg.sender === "user") {
          contents.push({
            role: "user",
            parts: [{ text: msg.text }],
          });
        } else {
          contents.push({
            role: "model",
            parts: [{ text: msg.text }],
          });
        }
      }

      // Check if the user's latest message is already handled in the loop, if not, append it
      const lastContent = contents[contents.length - 1];
      if (!lastContent || lastContent.role !== "user" || lastContent.parts[0].text !== message) {
        const parts: any[] = [{ text: message }];
        if (image && imageMimeType) {
          const base64Data = image.includes(",") ? image.split(",")[1] : image;
          parts.push({
            inlineData: {
              mimeType: imageMimeType,
              data: base64Data,
            },
          });
        }
        contents.push({
          role: "user",
          parts: parts,
        });
      } else if (image && imageMimeType) {
        const base64Data = image.includes(",") ? image.split(",")[1] : image;
        lastContent.parts.push({
          inlineData: {
            mimeType: imageMimeType,
            data: base64Data,
          },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: sysInstruction,
          temperature: 0.2,
        },
      });

      const replyText = response.text || fallbackReply;

      // Append bot reply
      const botMsg = {
        id: Math.random().toString(36).substring(7),
        sender: "bot" as const,
        text: replyText,
        timestamp: new Date().toISOString(),
      };
      
      session.messages.push(botMsg);
      session.lastUpdated = new Date().toISOString();
      await session.save();

      return res.json({ reply: replyText });

    } catch (error) {
      console.error("Chat error:", error);
      const contactPhone = req.body?.siteConfig?.contactPhone || "+880 1837-587551";
      const fallbackReply = `আসসালামু আলাইকুম! আমাদের সাথে যোগাযোগের জন্য ধন্যবাদ। আমাদের একজন প্রতিনিধি খুব শীঘ্রই আপনার সাথে যোগাযোগ করবেন। জরুরী প্রয়োজনে আমাদের কাস্টমার কেয়ার নম্বরে কল করুন: ${contactPhone}।`;
      return res.json({
        reply: fallbackReply
      });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
