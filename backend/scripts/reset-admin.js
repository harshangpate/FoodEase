import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";

const resetAdmin = async () => {
    try {
        // Connect to FoodEase database
        await mongoose.connect('mongodb://localhost:27017/FoodEase');
        console.log("Connected to FoodEase database");

        // Delete existing admin if any
        await userModel.deleteMany({ isAdmin: true });
        console.log("Removed existing admin accounts");

        // Create new admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        const newAdmin = new userModel({
            name: "Admin",
            email: "admin@foodease.com",
            password: hashedPassword,
            isAdmin: true
        });

        await newAdmin.save();
        
        console.log("\nNew Admin Account Created in FoodEase:");
        console.log("Email: admin@foodease.com");
        console.log("Password: admin123");
        console.log("\nPlease use these credentials to login.");

        // Verify admin creation
        const adminUser = await userModel.findOne({ isAdmin: true });
        console.log("\nVerifying admin in database:", adminUser ? "Success" : "Failed");

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

resetAdmin();
