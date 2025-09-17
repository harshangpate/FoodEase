import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    try {
        // Use environment variable for MongoDB URI or fallback to local DB for development
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/FoodEase';
        await mongoose.connect(mongoURI);
        console.log("DB Connected to", mongoURI.includes("localhost") ? "local database" : "cloud database");
    } catch (error) {
        console.error("DB Connection Error:", error);
    }
}