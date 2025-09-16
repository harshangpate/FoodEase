import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { 
    listOrders, 
    placeOrder, 
    updateStatus, 
    userOrders, 
    placeOrderCod, 
    verifyPayment,
    regeneratePayment,
    checkReferenceId,
    generateInvoice,
    serveInvoice,
    generateMonthlyReport,
    serveReport,
    getOrderDetails
} from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.get("/list", listOrders);
orderRouter.post('/place', authMiddleware, placeOrder);
orderRouter.post("/placecod", authMiddleware, placeOrderCod);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.post("/verify-payment", authMiddleware, verifyPayment);
orderRouter.post("/check-reference", authMiddleware, checkReferenceId); // Add this new route
orderRouter.post("/status", authMiddleware, updateStatus);
orderRouter.post("/regenerate-payment", authMiddleware, regeneratePayment);

// Order details endpoint
orderRouter.post("/details", authMiddleware, getOrderDetails);

// Invoice and report routes
orderRouter.post("/generate-invoice/:orderId", authMiddleware, generateInvoice);
orderRouter.get("/invoice/:filename", serveInvoice);
orderRouter.post("/generate-report/:month/:year", authMiddleware, generateMonthlyReport);
orderRouter.get("/report/:filename", serveReport);

export default orderRouter;