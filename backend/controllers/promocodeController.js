import promocodeModel from "../models/promocodeModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

// Validate a promocode
export const validatePromocode = async (req, res) => {
    try {
        const { code, orderAmount, userId } = req.body;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Promocode is required"
            });
        }

        // Find the promocode (case insensitive)
        const promocode = await promocodeModel.findOne({ 
            code: { $regex: new RegExp(`^${code}$`, 'i') },
            isActive: true,
            expiryDate: { $gt: new Date() }
        });

        if (!promocode) {
            return res.status(404).json({
                success: false,
                message: "Invalid or expired promocode"
            });
        }

        // Check minimum order value
        if (orderAmount < promocode.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of ₹${promocode.minOrderValue} required`
            });
        }

        // If userId is provided, check user-specific restrictions
        if (userId) {
            const user = await userModel.findById(userId);
            
            if (user) {
                // Check if user has already used this promocode
                if (user.usedPromocodes && user.usedPromocodes.includes(promocode._id.toString())) {
                    return res.status(400).json({
                        success: false,
                        message: "You have already used this promocode"
                    });
                }
                
                // Check if it's a welcome code and user has previous orders
                if (promocode.isWelcomeCode) {
                    const previousOrders = await orderModel.countDocuments({ user: userId });
                    if (previousOrders > 0) {
                        return res.status(400).json({
                            success: false,
                            message: "Welcome promocodes are only for first-time orders"
                        });
                    }
                }
            }
        }

        const discountAmount = (orderAmount * promocode.discountPercentage / 100).toFixed(2);

        return res.status(200).json({
            success: true,
            message: "Promocode applied successfully",
            data: {
                discountAmount: parseFloat(discountAmount),
                discountPercentage: promocode.discountPercentage,
                promocodeId: promocode._id
            }
        });
    } catch (error) {
        console.error("Promocode validation error:", error);
        return res.status(500).json({
            success: false,
            message: "Error validating promocode"
        });
    }
};

// Admin: Create a new promocode
export const createPromocode = async (req, res) => {
    try {
        const { code, discountPercentage, minOrderValue, expiryDate, isWelcomeCode } = req.body;
        
        if (!code || !discountPercentage || !expiryDate) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }
        
        // Check if promocode already exists
        const existingPromocode = await promocodeModel.findOne({ code });
        if (existingPromocode) {
            return res.status(400).json({
                success: false,
                message: "Promocode already exists"
            });
        }
        
        const newPromocode = new promocodeModel({
            code,
            discountPercentage,
            minOrderValue: minOrderValue || 0,
            expiryDate,
            isActive: true,
            isWelcomeCode: isWelcomeCode || false
        });
        
        await newPromocode.save();
        
        return res.status(201).json({
            success: true,
            message: "Promocode created successfully",
            data: newPromocode
        });
    } catch (error) {
        console.error("Create promocode error:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating promocode"
        });
    }
};

// Toggle promocode active status
export const togglePromoStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        if (isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: "isActive status is required"
            });
        }
        
        const updatedPromocode = await promocodeModel.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        );
        
        if (!updatedPromocode) {
            return res.status(404).json({
                success: false,
                message: "Promocode not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: `Promocode ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: updatedPromocode
        });
    } catch (error) {
        console.error("Toggle promocode status error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating promocode status"
        });
    }
};

// For user: Get all active promocodes
export const getActivePromocodes = async (req, res) => {
    try {
        // Find all active promocodes that haven't expired
        const promocodes = await promocodeModel.find({
            isActive: true,
            expiryDate: { $gt: new Date() }
        }).select('code discountPercentage minOrderValue expiryDate isWelcomeCode');
        
        return res.status(200).json({
            success: true,
            data: promocodes
        });
    } catch (error) {
        console.error("Get active promocodes error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching active promocodes"
        });
    }
};

// Admin: Get all promocodes
export const getAllPromocodes = async (req, res) => {
    try {
        const promocodes = await promocodeModel.find().sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            data: promocodes
        });
    } catch (error) {
        console.error("Get promocodes error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching promocodes"
        });
    }
};

// Record used promocode for a user
export const recordUsedPromocode = async (req, res) => {
    try {
        const { userId, promocodeId } = req.body;
        
        if (!userId || !promocodeId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Promocode ID are required"
            });
        }
        
        const user = await userModel.findByIdAndUpdate(
            userId,
            { $addToSet: { usedPromocodes: promocodeId } },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Promocode usage recorded successfully"
        });
    } catch (error) {
        console.error("Record used promocode error:", error);
        return res.status(500).json({
            success: false,
            message: "Error recording promocode usage"
        });
    }
};