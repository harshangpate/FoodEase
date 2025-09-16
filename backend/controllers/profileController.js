// Add a user profile API endpoint to the backend
import express from 'express';
import userModel from '../models/userModel.js';

// Function to get user profile data
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await userModel.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching user profile"
        });
    }
};

// Function to update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, parentEmail, phone } = req.body;
        
        // Find user
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        // Update fields
        if (name) user.name = name;
        if (parentEmail !== undefined) user.parentEmail = parentEmail;
        if (phone !== undefined) user.phone = phone;
        
        // Save the updated user
        await user.save();
        
        // Return updated user without password
        const updatedUser = await userModel.findById(userId).select('-password');
        
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating user profile"
        });
    }
};