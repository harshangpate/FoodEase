import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import QRCode from 'qrcode';
import crypto from 'crypto';

//config variables
const currency = "inr";
const deliveryCharge = 5;
const frontend_URL = 'http://localhost:5173';

// Add these constants at the top
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID;
const MERCHANT_NAME = process.env.MERCHANT_NAME;

// Placing User Order for Frontend using stripe
const placeOrder = async (req, res) => {
    try {
        // Generate unique reference ID
        const referenceId = crypto.randomBytes(6).toString('hex').toUpperCase();
        const totalAmount = req.body.amount + deliveryCharge;

        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: totalAmount,
            address: req.body.address,
            referenceId: referenceId,
            payment: false
        });
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // Create UPI payment URL
        const upiUrl = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${MERCHANT_NAME}&am=${totalAmount}&tn=${referenceId}&cu=INR`;
        
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
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            payment: true,
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        res.json({ success: true, message: "Order Placed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Listing Order for Admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
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
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false, message: "Not Paid" })
        }
    } catch (error) {
        res.json({ success: false, message: "Not  Verified" })
    }

}

// Add new verification endpoint
const verifyPayment = async (req, res) => {
    try {
        const { orderId, referenceId } = req.body;
        console.log("Verifying payment for:", { orderId, referenceId });
        
        const order = await orderModel.findOne({ 
            _id: orderId,
            referenceId: referenceId
        });

        if (!order) {
            console.log("Order not found");
            return res.json({ success: false, message: "Order not found" });
        }

        // Check if payment is already verified
        if (order.paymentVerified) {
            return res.json({ success: false, message: "Payment already verified" });
        }

        // Check if order is expired
        const timeDiff = Date.now() - new Date(order.date).getTime();
        if (timeDiff > 300000) {
            await orderModel.findByIdAndDelete(orderId);
            return res.json({ success: false, message: "Payment time expired" });
        }

        // Here's the new payment verification logic
        try {
            // Simulate checking with UPI system
            const paymentStatus = await checkUPIPayment(referenceId);
            
            if (paymentStatus === 'success') {
                order.payment = true;
                order.paymentVerified = true;
                order.paymentStatus = 'completed';
                await order.save();
                console.log("Payment verified successfully");
                return res.json({ success: true, message: "Payment verified successfully" });
            } else {
                console.log("Payment not received");
                return res.json({ success: false, message: "Payment not received yet" });
            }
        } catch (error) {
            console.error("Payment verification error:", error);
            return res.json({ success: false, message: "Error checking payment status" });
        }
    } catch (error) {
        console.error("Verification error:", error);
        res.json({ success: false, message: "Error in verification" });
    }
};

// Add this helper function
const checkUPIPayment = async (referenceId) => {
    // This is where you'd normally integrate with a UPI payment system
    // For now, we'll simulate a check that returns success only if payment was made
    
    // Simulate API call to UPI system
    return new Promise((resolve) => {
        setTimeout(() => {
            // For testing: randomly return success/pending to simulate real payment scenario
            const status = Math.random() < 0.5 ? 'success' : 'pending';
            resolve(status);
        }, 1000);
    });
};

// Add updateStatus to the exports
export { 
    placeOrder, 
    placeOrderCod, 
    listOrders, 
    userOrders, 
    updateStatus, 
    verifyOrder, 
    verifyPayment 
};