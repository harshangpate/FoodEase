// Monthly expense report controller functions
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import moment from 'moment';
import { generateMonthlyExpenseReport } from '../utils/pdf/pdfGenerator.js';
import { sendMonthlyReportEmail } from '../utils/email/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define report directory
const reportDir = path.join(__dirname, '..', 'reports');

// Create report directory if it doesn't exist
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
}

// Generate and send a monthly expense report for a specific user
export const generateUserMonthlyReport = async (req, res) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.query;
        
        // Default to previous month if not specified
        const reportMonth = month ? parseInt(month) : moment().subtract(1, 'month').month() + 1; // moment months are 0-indexed
        const reportYear = year ? parseInt(year) : moment().year();
        
        // Validate month and year
        if (reportMonth < 1 || reportMonth > 12) {
            return res.status(400).json({
                success: false,
                message: "Invalid month. Month must be between 1 and 12."
            });
        }
        
        if (reportYear < 2020 || reportYear > moment().year()) {
            return res.status(400).json({
                success: false,
                message: "Invalid year."
            });
        }
        
        // Get user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        // Calculate start and end dates for the specified month
        const startDate = moment(`${reportYear}-${reportMonth}-01`).startOf('month').toDate();
        const endDate = moment(startDate).endOf('month').toDate();
        
        // Get all completed orders for the user within the specified month
        const orders = await orderModel.find({
            userId: userId,
            createdAt: { $gte: startDate, $lte: endDate },
            status: "Completed",  // Only include completed orders
            payment: true  // Only include paid orders
        }).sort({ createdAt: 1 });
        
        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No completed orders found for the specified month"
            });
        }
        
        // Generate the PDF report
        const reportPath = await generateMonthlyExpenseReport(user, orders, reportMonth, reportYear, reportDir);
        
        // Send the report via email
        await sendMonthlyReportEmail(user, reportMonth, reportYear, reportPath);
        
        return res.json({
            success: true,
            message: "Monthly expense report generated and sent successfully",
            reportPath: reportPath
        });
    } catch (error) {
        console.error("Error generating monthly report:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while generating monthly report"
        });
    }
};

// Generate monthly reports for all users (for admin/scheduled task)
export const generateAllMonthlyReports = async (req, res) => {
    try {
        // Only allow admins to trigger this
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to perform this action"
            });
        }
        
        // Default to previous month
        const reportMonth = moment().subtract(1, 'month').month() + 1; // moment months are 0-indexed
        const reportYear = moment().year();
        
        // Calculate start and end dates for the previous month
        const startDate = moment(`${reportYear}-${reportMonth}-01`).startOf('month').toDate();
        const endDate = moment(startDate).endOf('month').toDate();
        
        // Get all users
        const users = await userModel.find({});
        
        let successCount = 0;
        let errorCount = 0;
        
        // Process each user
        for (const user of users) {
            try {
                // Get completed and paid orders for this user
                const orders = await orderModel.find({
                    userId: user._id,
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: "Completed",
                    payment: true
                }).sort({ createdAt: 1 });
                
                // Skip users with no orders
                if (orders.length === 0) continue;
                
                // Generate the PDF report
                const reportPath = await generateMonthlyExpenseReport(user, orders, reportMonth, reportYear, reportDir);
                
                // Send the report via email
                await sendMonthlyReportEmail(user, reportMonth, reportYear, reportPath);
                
                successCount++;
            } catch (error) {
                console.error(`Error generating report for user ${user._id}:`, error);
                errorCount++;
            }
        }
        
        return res.json({
            success: true,
            message: `Monthly reports processed: ${successCount} successful, ${errorCount} failed`,
            details: {
                month: reportMonth,
                year: reportYear,
                successCount,
                errorCount
            }
        });
    } catch (error) {
        console.error("Error generating monthly reports:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while generating monthly reports"
        });
    }
};

// Schedule monthly report generation (to be called from a cron job)
export const scheduleMonthlyReports = async () => {
    try {
        console.log("Starting scheduled monthly report generation...");
        
        // Default to previous month
        const reportMonth = moment().subtract(1, 'month').month() + 1; // moment months are 0-indexed
        const reportYear = moment().year();
        
        console.log(`Generating reports for ${moment().month(reportMonth - 1).format('MMMM')} ${reportYear}`);
        
        // Calculate start and end dates for the previous month
        const startDate = moment(`${reportYear}-${reportMonth}-01`).startOf('month').toDate();
        const endDate = moment(startDate).endOf('month').toDate();
        
        // Get all users
        const users = await userModel.find({});
        
        let successCount = 0;
        let errorCount = 0;
        
        // Process each user
        for (const user of users) {
            try {
                // Get completed and paid orders for this user
                const orders = await orderModel.find({
                    userId: user._id,
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: "Completed",
                    payment: true
                }).sort({ createdAt: 1 });
                
                // Skip users with no orders
                if (orders.length === 0) continue;
                
                // Generate the PDF report
                const reportPath = await generateMonthlyExpenseReport(user, orders, reportMonth, reportYear, reportDir);
                
                // Send the report via email
                await sendMonthlyReportEmail(user, reportMonth, reportYear, reportPath);
                
                successCount++;
                console.log(`Report sent for user ${user.name} (${user.email})`);
            } catch (error) {
                console.error(`Error generating report for user ${user._id}:`, error);
                errorCount++;
            }
        }
        
        console.log(`Monthly reports completed: ${successCount} successful, ${errorCount} failed`);
        return { successCount, errorCount };
    } catch (error) {
        console.error("Error scheduling monthly reports:", error);
        throw error;
    }
};