import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import QRCode from 'qrcode';
import crypto from 'crypto';
import axios from 'axios';
import { generateOrderInvoice, generateMonthlyExpenseReport } from '../utils/pdf/pdfGenerator.js';
import { sendOrderStatusEmail, sendInvoiceEmail, sendMonthlyReportEmail } from '../utils/email/emailService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define invoice and report directories
const invoiceDir = path.join(__dirname, '..', 'invoices');
const reportDir = path.join(__dirname, '..', 'reports');

//config variables
const currency = "inr";
const deliveryCharge = 5;
const frontend_URL = 'http://localhost:5173';

// Add these constants at the top
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID;
const MERCHANT_NAME = process.env.MERCHANT_NAME;

// Placing User Order for Frontend using stripe
// In placeOrder function, add status field
// Modify the existing placeOrder function to handle partial payments
// In the placeOrder function
const placeOrder = async (req, res) => {
    try {
        const referenceId = crypto.randomBytes(6).toString('hex').toUpperCase();
        
        // Use the values directly from the request if provided
        let totalAmount, paidAmount, remainingAmount;
        
        // Get payment method and partial payment status
        const paymentMethod = req.body.paymentMethod || 'online';
        const isPartialPayment = paymentMethod === 'partial';
        
        // Get discount amount
        const discountAmount = parseFloat(req.body.discountAmount || 0);
        
        if (req.body.totalAmount) {
            // Use the pre-calculated values from the frontend
            totalAmount = parseFloat(req.body.totalAmount);
            paidAmount = parseFloat(req.body.paidAmount || totalAmount);
            remainingAmount = parseFloat(req.body.remainingAmount || 0);
        } else {
            // Calculate if not provided
            // Calculate total amount with precision - start with base amount
            let baseAmount = parseFloat(req.body.amount);
            console.log("Base amount:", baseAmount);
            
            console.log("Discount amount:", discountAmount);
            
            // Calculate discounted base amount (don't let it go below 0)
            let discountedBaseAmount = Math.max(0, baseAmount - discountAmount);
            console.log("Discounted base amount:", discountedBaseAmount);
            
            // Now add platform Fee to the discounted base amount
            totalAmount = discountedBaseAmount + parseFloat(deliveryCharge);
            console.log("After platform Fee:", totalAmount);
            
            // Add rush charges if applicable
            if (req.body.orderType === 'rush') {
                totalAmount += 20; // Rush order premium
                console.log("After rush charge:", totalAmount);
            }
        
            // Ensure amount is properly formatted with 2 decimal places
            totalAmount = parseFloat(totalAmount.toFixed(2));
            
            // Calculate actual payment amount based on payment method
            paidAmount = isPartialPayment 
                ? parseFloat((totalAmount * 0.4).toFixed(2))
                : totalAmount;
                
            remainingAmount = isPartialPayment 
                ? parseFloat((totalAmount * 0.6).toFixed(2))
                : 0;
        }
        
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
            promocodeUsed: promocodeUsed,
            // Add payment information
            paymentMethod: paymentMethod,
            isPartialPayment: isPartialPayment,
            paidAmount: paidAmount,
            remainingAmount: remainingAmount
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

        // Create UPI payment URL with the correct amount
        const upiUrl = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${MERCHANT_NAME}&am=${paidAmount.toFixed(2)}&tn=${referenceId}&cu=INR`;
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(upiUrl);

        res.json({
            success: true,
            orderId: newOrder._id,
            qrCode: qrCode,
            amount: paidAmount, // Send the exact paid amount
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
            console.log("COD - After platform Fee", totalAmount);
        } else {
            console.log("COD - platform Fee already included in base amount");
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
        // Get the old order to have access to the current status and user ID
        const oldOrder = await orderModel.findById(req.body.orderId);
        if (!oldOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Get the old status before updating
        const oldStatus = oldOrder.status;
        const newStatus = req.body.status;

        // Update the order status
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: newStatus });

        // Only send email if the status actually changed
        if (oldStatus !== newStatus) {
            // Get the user details
            const user = await userModel.findById(oldOrder.userId);
            if (user) {
                // Send email notification about status update
                await sendOrderStatusEmail(oldOrder, user, oldStatus, newStatus);
            }
        }

        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating status" });
    }
};

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const user = await userModel.findById(order.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (success === "true") {
            // Update the order payment status
            order.payment = true;
            await order.save();
            
            // Send notification email about successful payment
            await sendOrderStatusEmail(
                order, 
                user, 
                order.status, 
                order.status, // Status doesn't change but we send a payment verification notification
                "Your payment has been verified successfully."
            );
            
            res.json({ success: true, message: "Paid" });
        }
        else {
            // Payment failed, delete the order
            await orderModel.findByIdAndDelete(orderId); // Fixed method name
            
            // Send notification about failed payment
            await sendOrderStatusEmail(
                order, 
                user, 
                order.status, 
                "Cancelled",
                "Your payment was not successful. Your order has been cancelled."
            );
            
            res.json({ success: false, message: "Not Paid" });
        }
    } catch (error) {
        console.error("Payment verification error:", error);
        res.json({ success: false, message: "Not Verified" });
    }
};

// Change from export const to just const
const verifyPayment = async (req, res) => {
  try {
    const { orderId, referenceId, paymentStatus } = req.body;
    
    if (!orderId || !referenceId) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID and Reference ID are required" 
      });
    }
    
    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    // Get user for email notification
    const user = await userModel.findById(order.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Update the order with payment verification details
    order.referenceId = referenceId;
    order.paymentVerified = true; // Explicitly set paymentVerified to true
    
    // Only update status if it's still awaiting verification
    const oldStatus = order.status;
    if (order.status === "Awaiting Payment Verification") {
      order.status = "Order Received";
    }
    
    await order.save();
    
    // Send payment verification email
    await sendOrderStatusEmail(
      order,
      user,
      oldStatus,
      order.status,
      "Your payment has been verified successfully. Your order is now being processed."
    );
    
    // Generate invoice after payment verification
    const invoicePath = await generateOrderInvoice(order, user);
    
    // Send invoice email if invoice was generated
    if (invoicePath) {
      await sendInvoiceEmail(order, user, invoicePath);
    }
    
    return res.json({ 
      success: true, 
      message: "Payment verified successfully" 
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error while verifying payment" 
    });
  }
};

// Add this new function to check reference IDs

// Change from export const to just const
const checkReferenceId = async (req, res) => {
  try {
    const { orderId, referenceId } = req.body;
    
    if (!orderId || !referenceId) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID and Reference ID are required" 
      });
    }
    
    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    // Check if the order already has a reference ID stored
    if (order.referenceId && order.referenceId !== referenceId) {
      return res.status(400).json({
        success: false,
        message: "Reference ID does not match our records"
      });
    }
    
    // If we're here, either:
    // 1. The order doesn't have a reference ID yet (first verification)
    // 2. The provided reference ID matches what's stored
    
    return res.json({ 
      success: true, 
      message: "Reference ID is valid" 
    });
  } catch (error) {
    console.error("Reference ID check error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error while checking reference ID" 
    });
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
        const amount = order.isPartialPayment ? 
            parseFloat(order.paidAmount).toFixed(2) : 
            parseFloat(order.amount).toFixed(2);
        
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

// Generate invoice for an order
const generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.body.userId;

        // Find the order
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        // Check if user is authorized to access this order
        if (order.userId.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized access to order" });
        }

        // Get user details
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Generate invoice
        const invoicePath = await generateOrderInvoice(order, user, invoiceDir);
        
        // Get filename from path
        const filename = path.basename(invoicePath);
        
        res.json({
            success: true,
            message: "Invoice generated successfully",
            invoiceUrl: `/api/order/invoice/${filename}`
        });
    } catch (error) {
        console.error("Invoice generation error:", error);
        res.json({ success: false, message: "Error generating invoice" });
    }
};

// Serve invoice PDF
const serveInvoice = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(invoiceDir, filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }
        
        // Set content type and send file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error("Error serving invoice:", error);
        res.status(500).json({ success: false, message: "Error serving invoice" });
    }
};

// Generate monthly expense report
const generateMonthlyReport = async (req, res) => {
    try {
        const userId = req.body.userId;
        const { month, year } = req.params;
        
        // Validate month and year
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12 || isNaN(yearNum)) {
            return res.json({ success: false, message: "Invalid month or year" });
        }
        
        // Get user details
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        
        // Calculate start and end date for the month
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
        
        // Find all orders for the user in the given month
        const orders = await orderModel.find({
            userId: userId,
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $nin: ['Cancelled', 'Awaiting Payment Verification'] }
        }).sort({ createdAt: -1 });
        
        if (orders.length === 0) {
            return res.json({ 
                success: false, 
                message: `No orders found for ${moment().month(monthNum - 1).format('MMMM')} ${yearNum}` 
            });
        }
        
        // Generate report
        const reportPath = await generateMonthlyExpenseReport(user, orders, monthNum, yearNum, reportDir);
        
        // Get filename from path
        const filename = path.basename(reportPath);
        
        res.json({
            success: true,
            message: "Monthly report generated successfully",
            reportUrl: `/api/order/report/${filename}`
        });
    } catch (error) {
        console.error("Report generation error:", error);
        res.json({ success: false, message: "Error generating monthly report" });
    }
};

// Serve report PDF
const serveReport = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(reportDir, filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        
        // Set content type and send file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error("Error serving report:", error);
        res.status(500).json({ success: false, message: "Error serving report" });
    }
};

// Get order details function
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Validate orderId
    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }
    
    // Find order by ID
    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    
    // Check if the order belongs to the user making the request
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.json({ 
        success: false, 
        message: "You don't have permission to view this order" 
      });
    }
    
    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.json({ 
      success: false, 
      message: "Error retrieving order details" 
    });
  }
};

// Keep the export list with all functions
export { 
    placeOrder, 
    placeOrderCod, 
    listOrders, 
    userOrders, 
    updateStatus, 
    verifyOrder,
    verifyPayment,
    regeneratePayment,
    checkReferenceId,
    generateInvoice,
    serveInvoice,
    generateMonthlyReport,
    serveReport,
    getOrderDetails
};