import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import 'dotenv/config';

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/FoodEase');
        console.log("Connected to database");

        // Check if admin exists
        const adminExists = await userModel.findOne({ isAdmin: true });
        if (adminExists) {
            console.log("Admin already exists!");
            process.exit(0);
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123456", salt);

        const adminUser = new userModel({
            name: "Admin",
            email: "admin@fooddelivery.com",
            password: hashedPassword,
            isAdmin: true
        });

        await adminUser.save();
        console.log("Admin created successfully!");
        console.log("Email: admin@fooddelivery.com");
        console.log("Password: admin123456");

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

createAdmin();
