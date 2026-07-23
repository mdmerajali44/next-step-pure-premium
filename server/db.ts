import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<username>") || uri.includes("<password>") || uri.includes("cluster.mongodb.net")) {
    console.log("ℹ️ MONGODB_URI is not defined or using template placeholder. Operating with in-memory database fallback.");
    return false;
  }
  
  try {
    // Prevent multiple connections
    if (mongoose.connection.readyState >= 1) {
      return true;
    }
    
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log("🔌 Connected to MongoDB Atlas successfully!");
    return true;
  } catch (error: any) {
    console.warn("⚠️ MongoDB connection unavailable. Operating with in-memory fallback:", error?.message || error);
    return false;
  }
}

