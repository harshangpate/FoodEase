import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";

const checkAndCreateAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/FoodEase');
        console.log("Connected to database");

        // Check if admin exists
        const adminExists = await userModel.findOne({ isAdmin: true });
        
        if (adminExists) {
            console.log("Existing Admin Found:");
            console.log("Email:", adminExists.email);
            console.log("Is Admin:", adminExists.isAdmin);
        } else {
            // Create new admin
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("admin123", salt);

            const newAdmin = new userModel({
                name: "Admin User",
                email: "admin@fooddelivery.com",
                password: hashedPassword,
                isAdmin: true
            });

            await newAdmin.save();
            console.log("New Admin Created Successfully!");
            console.log("Email: admin@fooddelivery.com");
            console.log("Password: admin123");
        }

        // List all users with admin status
        const allUsers = await userModel.find({});
        console.log("\nAll Users in Database:");
        allUsers.forEach(user => {
            console.log(`Email: ${user.email}, Is Admin: ${user.isAdmin}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkAndCreateAdmin();