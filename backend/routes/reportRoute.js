import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { generateUserMonthlyReport, generateAllMonthlyReports } from '../controllers/reportController.js';

const router = express.Router();

// Generate and send monthly expense report for a specific user
// Admin can generate for any user, regular users can only generate for themselves
router.get('/monthly/:userId', verifyToken, async (req, res) => {
    // Check if user is requesting their own report or is an admin
    if (req.user.id === req.params.userId || req.user.isAdmin) {
        return await generateUserMonthlyReport(req, res);
    } else {
        return res.status(403).json({
            success: false,
            message: "Not authorized to access this report"
        });
    }
});

// Generate monthly reports for all users - admin only
router.post('/monthly/generate-all', verifyToken, isAdmin, generateAllMonthlyReports);

export default router;