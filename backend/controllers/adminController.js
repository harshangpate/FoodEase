import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

// Admin login
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt received for:", email);

    try {
        const user = await userModel.findOne({ email });
        
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.isAdmin) {
            return res.json({ success: false, message: "Admin access denied" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, isAdmin: true },
            process.env.JWT_SECRET || 'defaultsecret',
            { expiresIn: '1y' }
        );
        
        res.status(200).json({
            success: true,
            token,
            redirectUrl: '/dashboard',
            admin: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.json({ success: false, message: "Error during admin login" });
    }
};

// Register first admin (one-time setup)
const registerFirstAdmin = async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        // Check if admin already exists
        const adminExists = await userModel.findOne({ isAdmin: true });
        if (adminExists) {
            return res.json({ success: false, message: "Admin already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const newAdmin = new userModel({
            name,
            email,
            password: hashedPassword,
            isAdmin: true
        });

        await newAdmin.save();
        
        // Create token
        const token = jwt.sign(
            { id: newAdmin._id, isAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: "Admin created successfully",
            token
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error creating admin" });
    }
}

// Get all users
const getUsers = async (req, res) => {
    try {
        // Create filter based on query parameters
        const filter = { isAdmin: false }; // Only non-admin users
        
        if (req.query.email) {
            filter.email = { $regex: new RegExp(req.query.email, 'i') };
        }
        
        if (req.query.name) {
            filter.name = { $regex: new RegExp(req.query.name, 'i') };
        }
        
        if (req.query.parentEmail) {
            filter.parentEmail = { $regex: new RegExp(req.query.parentEmail, 'i') };
        }

        // Get users with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const users = await userModel.find(filter)
            .select('name email parentEmail createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await userModel.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            users,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};

// Get specific user by ID
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        const user = await userModel.findById(userId)
            .select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details'
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, parentEmail, password } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Prevent changing admin status through this route
        if (user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify admin users through this API'
            });
        }
        
        // Update user object
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (parentEmail !== undefined) updates.parentEmail = parentEmail;
        
        // If password is being updated, hash it
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(password, salt);
        }
        
        // Update user in database
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true }
        ).select('-password');
        
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Prevent deleting admin users
        if (user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users through this API'
            });
        }
        
        // Delete user
        await userModel.findByIdAndDelete(userId);
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

export { adminLogin, registerFirstAdmin, getUsers, getUserById, updateUser, deleteUser };
