import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI is not defined in environment variables.");
    console.warn("Please add MONGODB_URI to your environment variables on Render or in your .env file.");
    return false;
  }
  
  try {
    // Prevent multiple connections
    if (mongoose.connection.readyState >= 1) {
      return true;
    }
    
    await mongoose.connect(uri);
    console.log("🔌 Connected to MongoDB Atlas successfully!");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    return false;
  }
}
