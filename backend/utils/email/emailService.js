import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create nodemailer transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send welcome email
export const sendWelcomeEmail = async (user) => {
    try {
        const transporter = createTransporter();
        
        // Email content
        const mailOptions = {
            from: `"FoodEase" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Welcome to FoodEase!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #FF4C24;">Welcome to FoodEase!</h1>
                    </div>
                    
                    <p>Hello ${user.name},</p>
                    
                    <p>Thank you for registering with FoodEase, your one-stop solution for delicious meals at ITM (SLS) Baroda University.</p>
                    
                    <p>With FoodEase, you can:</p>
                    <ul>
                        <li>Browse our extensive menu from Canteen, Gazebo, and Tea Post</li>
                        <li>Place regular, rush, or scheduled orders</li>
                        <li>Track your order status in real-time</li>
                        <li>Apply promocodes for discounts</li>
                        <li>Choose between full payment or partial payment options</li>
                    </ul>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #FF4C24; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Ordering Now</a>
                    </div>
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:support@foodease.com">support@foodease.com</a>.</p>
                    
                    <p>Happy ordering!</p>
                    
                    <p>Best regards,<br>The FoodEase Team</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center;">
                        <p>This email was sent to you because you registered on FoodEase. If you didn't register, please ignore this email.</p>
                    </div>
                </div>
            `
        };
        
        // Send email to user
        await transporter.sendMail(mailOptions);
        
        // If parent email is provided, send a notification to parent as well
        if (user.parentEmail) {
            const parentMailOptions = {
                from: `"FoodEase" <${process.env.EMAIL_USER}>`,
                to: user.parentEmail,
                subject: `Your Child ${user.name} Has Registered on FoodEase`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #FF4C24;">FoodEase Parent Notification</h1>
                        </div>
                        
                        <p>Hello,</p>
                        
                        <p>We're writing to inform you that ${user.name} has registered with FoodEase, the food ordering system at ITM (SLS) Baroda University.</p>
                        
                        <p>FoodEase provides students with a convenient way to order food from campus food outlets. As a parent, you will receive notifications about your child's monthly expenses.</p>
                        
                        <p>If you have any questions or concerns, please feel free to contact us at <a href="mailto:support@foodease.com">support@foodease.com</a>.</p>
                        
                        <p>Best regards,<br>The FoodEase Team</p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center;">
                            <p>You're receiving this email because your email was provided as a parent contact by ${user.name} during registration on FoodEase.</p>
                        </div>
                    </div>
                `
            };
            
            await transporter.sendMail(parentMailOptions);
        }
        
        console.log(`Welcome email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

// Send order status update email
export const sendOrderStatusEmail = async (order, user, oldStatus, newStatus, customMessage = null) => {
    try {
        const transporter = createTransporter();
        
        // Define status explanations
        const statusExplanations = {
            'Awaiting Payment Verification': 'Your payment is being verified.',
            'Order Received': 'We have received your order and are processing it.',
            'Order Confirmed': 'Your order has been confirmed and will be prepared soon.',
            'In Kitchen Queue': 'Your order is in line for preparation.',
            'Preparing Food': 'Our chefs are preparing your delicious meal.',
            'Ready for Pickup': 'Your order is ready! Please come to collect it.',
            'Waiting for Collection': 'Your order is waiting for you to collect.',
            'Completed': 'Your order has been successfully completed.',
            'Cancelled': 'Your order has been cancelled.'
        };
        
        // Get status explanation - use custom message if provided
        const explanation = customMessage || statusExplanations[newStatus] || 'Your order status has been updated.';
        
        // Email content
        const mailOptions = {
            from: `"FoodEase" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Order #${order._id} Status Update: ${newStatus}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #FF4C24;">Order Status Update</h1>
                    </div>
                    
                    <p>Hello ${user.name},</p>
                    
                    <p>Your order status has been updated.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
                        <p style="margin: 5px 0;"><strong>Previous Status:</strong> ${oldStatus}</p>
                        <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: #FF4C24; font-weight: bold;">${newStatus}</span></p>
                        <p style="margin: 5px 0;"><strong>Updated On:</strong> ${moment().format('DD/MM/YYYY, h:mm A')}</p>
                    </div>
                    
                    <p>${explanation}</p>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-orders" style="background-color: #FF4C24; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Order Details</a>
                    </div>
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:support@foodease.com">support@foodease.com</a>.</p>
                    
                    <p>Thank you for choosing FoodEase!</p>
                    
                    <p>Best regards,<br>The FoodEase Team</p>
                </div>
            `
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        console.log(`Order status email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Error sending order status email:', error);
        return false;
    }
};

// Send invoice email
export const sendInvoiceEmail = async (order, user, invoicePath) => {
    try {
        const transporter = createTransporter();
        
        // Email content
        const mailOptions = {
            from: `"FoodEase" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Your Invoice for Order #${order._id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #FF4C24;">Your FoodEase Invoice</h1>
                    </div>
                    
                    <p>Hello ${user.name},</p>
                    
                    <p>Thank you for your order! Please find attached your invoice for order #${order._id}.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
                        <p style="margin: 5px 0;"><strong>Order Date:</strong> ${moment(order.createdAt).format('DD/MM/YYYY, h:mm A')}</p>
                        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.amount.toFixed(2)}</p>
                        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    </div>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-orders" style="background-color: #FF4C24; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Order Details</a>
                    </div>
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:support@foodease.com">support@foodease.com</a>.</p>
                    
                    <p>Thank you for choosing FoodEase!</p>
                    
                    <p>Best regards,<br>The FoodEase Team</p>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice-Order-${order._id}.pdf`,
                    path: invoicePath
                }
            ]
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        
        // If parent email is provided, send the invoice to parent as well
        if (user.parentEmail) {
            const parentMailOptions = {
                from: `"FoodEase" <${process.env.EMAIL_USER}>`,
                to: user.parentEmail,
                subject: `Your Child's Invoice for Order #${order._id}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #FF4C24;">FoodEase Invoice</h1>
                        </div>
                        
                        <p>Hello,</p>
                        
                        <p>We're sending you a copy of the invoice for your child ${user.name}'s recent order at FoodEase.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
                            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${moment(order.createdAt).format('DD/MM/YYYY, h:mm A')}</p>
                            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.amount.toFixed(2)}</p>
                            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                        </div>
                        
                        <p>Please find the invoice attached to this email.</p>
                        
                        <p>If you have any questions or concerns, please feel free to contact us at <a href="mailto:support@foodease.com">support@foodease.com</a>.</p>
                        
                        <p>Best regards,<br>The FoodEase Team</p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center;">
                            <p>You're receiving this email because your email was provided as a parent contact by ${user.name} during registration on FoodEase.</p>
                        </div>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Invoice-Order-${order._id}.pdf`,
                        path: invoicePath
                    }
                ]
            };
            
            await transporter.sendMail(parentMailOptions);
        }
        
        console.log(`Invoice email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Error sending invoice email:', error);
        return false;
    }
};

// Send monthly expense report email
export const sendMonthlyReportEmail = async (user, month, year, reportPath) => {
    try {
        const transporter = createTransporter();
        
        const monthName = moment().month(month - 1).format('MMMM');
        
        // Email content
        const mailOptions = {
            from: `"FoodEase" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Your Monthly Food Expense Report - ${monthName} ${year}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #FF4C24;">Monthly Expense Report</h1>
                    </div>
                    
                    <p>Hello ${user.name},</p>
                    
                    <p>Please find attached your monthly food expense report for ${monthName} ${year}.</p>
                    
                    <p>This report includes:</p>
                    <ul>
                        <li>A summary of all your orders for the month</li>
                        <li>Total amount spent</li>
                        <li>Total savings from promocodes</li>
                        <li>Details of each order</li>
                        <li>Your most frequently ordered items</li>
                    </ul>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" style="background-color: #FF4C24; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Profile</a>
                    </div>
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:support@foodease.com">support@foodease.com</a>.</p>
                    
                    <p>Thank you for choosing FoodEase!</p>
                    
                    <p>Best regards,<br>The FoodEase Team</p>
                </div>
            `,
            attachments: [
                {
                    filename: `FoodEase-Monthly-Report-${monthName}-${year}.pdf`,
                    path: reportPath
                }
            ]
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        
        // If parent email is provided, send the report to parent as well
        if (user.parentEmail) {
            const parentMailOptions = {
                from: `"FoodEase" <${process.env.EMAIL_USER}>`,
                to: user.parentEmail,
                subject: `Your Child's Monthly Food Expense Report - ${monthName} ${year}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #FF4C24;">Monthly Expense Report</h1>
                        </div>
                        
                        <p>Hello,</p>
                        
                        <p>We're sending you a copy of your child ${user.name}'s monthly food expense report for ${monthName} ${year} at ITM (SLS) Baroda University.</p>
                        
                        <p>This report includes:</p>
                        <ul>
                            <li>A summary of all orders placed during the month</li>
                            <li>Total amount spent</li>
                            <li>Total savings from promocodes</li>
                            <li>Details of each order</li>
                            <li>Most frequently ordered items</li>
                        </ul>
                        
                        <p>Please find the report attached to this email.</p>
                        
                        <p>If you have any questions or concerns about your child's expenses, please feel free to contact us at <a href="mailto:support@foodease.com">support@foodease.com</a>.</p>
                        
                        <p>Best regards,<br>The FoodEase Team</p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center;">
                            <p>You're receiving this email because your email was provided as a parent contact by ${user.name} during registration on FoodEase.</p>
                        </div>
                    </div>
                `,
                attachments: [
                    {
                        filename: `FoodEase-Monthly-Report-${monthName}-${year}.pdf`,
                        path: reportPath
                    }
                ]
            };
            
            await transporter.sendMail(parentMailOptions);
        }
        
        console.log(`Monthly report email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Error sending monthly report email:', error);
        return false;
    }
};