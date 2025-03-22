import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import QRCode from 'qrcode';
import crypto from 'crypto';
import axios from 'axios';

//config variables
const currency = "inr";
const deliveryCharge = 5;
const frontend_URL = 'http://localhost:5173';

// Add these constants at the top
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID;
const MERCHANT_NAME = process.env.MERCHANT_NAME;

// Placing User Order for Frontend using stripe
// In placeOrder function, add status field
const placeOrder = async (req, res) => {
    try {
        const referenceId = crypto.randomBytes(6).toString('hex').toUpperCase();
        
        // Calculate total amount with precision - start with base amount
        let baseAmount = parseFloat(req.body.amount);
        console.log("Base amount:", baseAmount);
        
        // Handle promocode discount first - only apply to the base amount
        const discountAmount = parseFloat(req.body.discountAmount || 0);
        console.log("Discount amount:", discountAmount);
        
        // Calculate discounted base amount (don't let it go below 0)
        let discountedBaseAmount = Math.max(0, baseAmount - discountAmount);
        console.log("Discounted base amount:", discountedBaseAmount);
        
        // Now add delivery charge to the discounted base amount
        let totalAmount = discountedBaseAmount + parseFloat(deliveryCharge);
        console.log("After delivery charge:", totalAmount);
        
        // Add rush charges if applicable
        if (req.body.orderType === 'rush') {
            totalAmount += 20; // Rush order premium
            console.log("After rush charge:", totalAmount);
        }

        // Ensure amount is properly formatted with 2 decimal places
        totalAmount = parseFloat(totalAmount.toFixed(2));
        console.log("Final amount:", totalAmount);

        const promocodeUsed = req.body.promocodeUsed || '';
        const promocodeId = req.body.promocodeId || '';

        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: totalAmount,
            address: req.body.address,
            referenceId: referenceId,
            payment: false,
            status: "Awaiting Payment Verification",
            paymentExpiry: new Date(Date.now() + 5 * 60 * 1000),
            orderType: req.body.orderType || 'regular',
            scheduledTime: req.body.scheduledTime || null,
            priority: req.body.orderType === 'rush' ? 1 : 0,
            rushCharges: req.body.orderType === 'rush' ? 20 : 0,
            discountAmount: discountAmount,
            promocodeUsed: promocodeUsed
        });
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // Record promocode usage if a promocode was used
        if (promocodeId && req.body.userId) {
            try {
                await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/promocode/record-usage`, {
                    userId: req.body.userId,
                    promocodeId: promocodeId
                });
            } catch (error) {
                console.error("Error recording promocode usage:", error);
                // Continue with order process even if recording fails
            }
        }

        // Create UPI payment URL
        const upiUrl = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${MERCHANT_NAME}&am=${totalAmount.toFixed(2)}&tn=${referenceId}&cu=INR`;
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(upiUrl);

        res.json({
            success: true,
            orderId: newOrder._id,
            qrCode: qrCode,
            amount: totalAmount,
            referenceId: referenceId,
            upiId: MERCHANT_UPI_ID
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

// Placing User Order for Frontend using stripe
const placeOrderCod = async (req, res) => {
    try {
        // Calculate total amount with precision - start with base amount
        let baseAmount = parseFloat(req.body.amount);
        console.log("COD - Base amount:", baseAmount);
        
        // Check if delivery charge is already included in the base amount
        let totalAmount = baseAmount;
        
        // Only add delivery charge if it's not already included
        if (!req.body.includesDeliveryCharge) {
            totalAmount += parseFloat(deliveryCharge);
            console.log("COD - After delivery charge:", totalAmount);
        } else {
            console.log("COD - Delivery charge already included in base amount");
        }
        
        if (req.body.orderType === 'rush') {
            totalAmount += 20; // Rush order premium
            console.log("COD - After rush charge:", totalAmount);
        }

        // Handle promocode discount
        const discountAmount = parseFloat(req.body.discountAmount || 0);
        console.log("COD - Discount amount:", discountAmount);
        const promocodeUsed = req.body.promocodeUsed || '';
        const promocodeId = req.body.promocodeId || '';
        
        // Apply discount to total amount
        if (discountAmount > 0) {
            totalAmount = totalAmount - discountAmount;
            console.log("COD - After discount:", totalAmount);
        }

        // Ensure amount is properly formatted with 2 decimal places
        // Use Math.max to ensure the amount is never negative
        totalAmount = Math.max(0, parseFloat(totalAmount.toFixed(2)));
        console.log("COD - Final amount:", totalAmount);

        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: totalAmount,
            address: req.body.address,
            payment: true,
            orderType: req.body.orderType || 'regular',
            scheduledTime: req.body.scheduledTime || null,
            priority: req.body.orderType === 'rush' ? 1 : 0,
            rushCharges: req.body.orderType === 'rush' ? 20 : 0,
            status: "Order Received",
            discountAmount: discountAmount,
            promocodeUsed: promocodeUsed
        });
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // Record promocode usage if a promocode was used
        if (promocodeId && req.body.userId) {
            try {
                await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/promocode/record-usage`, {
                    userId: req.body.userId,
                    promocodeId: promocodeId
                });
            } catch (error) {
                console.error("Error recording promocode usage:", error);
                // Continue with order process even if recording fails
            }
        }

        res.json({ success: true, message: "Order Placed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Listing Order for Admin panel
// Add a helper function to sort orders by priority and time
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
            .sort({ priority: -1, createdAt: 1 }); // Rush orders first, then by time
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// User Orders for Frontend
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const updateStatus = async (req, res) => {
    console.log(req.body);
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating status" });
    }
};

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Paid" })
        }
        else {
            await orderModel.findByIdDelete(orderId) // Fixed method name
            res.json({ success: false, message: "Not Paid" })
        }
    } catch (error) {
        res.json({ success: false, message: "Not  Verified" })
    }
};

// Add this to your existing orderController.js

// Update verifyPayment function with new features
const verifyPayment = async (req, res) => {
    try {
        const { orderId, referenceId } = req.body;
        
        if (!orderId || !referenceId) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        if (order.status !== "Awaiting Payment Verification") {
            return res.json({ success: false, message: "Order is not awaiting payment verification" });
        }

        if (order.paymentExpiry && new Date() > order.paymentExpiry) {
            return res.json({ success: false, message: "Payment verification time expired" });
        }

        if (order.referenceId !== referenceId) {
            return res.json({ success: false, message: "Invalid reference ID" });
        }

        const paymentAttempt = {
            referenceId,
            attemptTime: new Date(),
            status: "success"
            // Removed verifiedBy since we don't have user._id
        };

        await orderModel.findByIdAndUpdate(orderId, {
            status: "Food Processing",
            payment: true,
            verifiedAt: new Date(),
            transactionDetails: {
                referenceId,
                verificationTime: new Date(),
                paymentMethod: "UPI"
            },
            $push: { paymentAttempts: paymentAttempt }
        });

        return res.json({ 
            success: true, 
            message: "Payment verified successfully" 
        });
    } catch (error) {
        console.error("Payment verification error:", error);
        return res.json({ success: false, message: "Error verifying payment" });
    }
};

// Add new regeneratePayment function
const regeneratePayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await orderModel.findById(orderId);
        
        if (!order || order.payment || order.status !== "Awaiting Payment Verification") {
            return res.json({ success: false, message: "Invalid order for payment regeneration" });
        }

        const newReferenceId = crypto.randomBytes(6).toString('hex').toUpperCase();
        
        // Ensure amount is properly formatted
        const amount = parseFloat(order.amount).toFixed(2);
        
        const upiUrl = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${MERCHANT_NAME}&am=${amount}&tn=${newReferenceId}&cu=INR`;
        const qrCode = await QRCode.toDataURL(upiUrl);

        await orderModel.findByIdAndUpdate(orderId, {
            referenceId: newReferenceId,
            paymentExpiry: new Date(Date.now() + 5 * 60 * 1000),
            $push: { 
                paymentAttempts: {
                    referenceId: newReferenceId,
                    attemptTime: new Date(),
                    status: "pending"
                }
            }
        });

        return res.json({
            success: true,
            qrCode,
            referenceId: newReferenceId
        });
    } catch (error) {
        console.error("Payment regeneration error:", error);
        return res.json({ success: false, message: "Error regenerating payment" });
    }
};

// Add regeneratePayment to exports
export { 
    placeOrder, 
    placeOrderCod, 
    listOrders, 
    userOrders, 
    updateStatus, 
    verifyOrder,
    verifyPayment,
    regeneratePayment
};