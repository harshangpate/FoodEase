import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { 
    listOrders, 
    placeOrder, 
    updateStatus, 
    userOrders, 
    placeOrderCod, 
    verifyPayment,
    regeneratePayment 
} from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.get("/list", listOrders);
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/placecod", authMiddleware, placeOrderCod);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.post("/verify-payment", authMiddleware, verifyPayment);
orderRouter.post("/status", authMiddleware, updateStatus);
orderRouter.post("/regenerate-payment", authMiddleware, regeneratePayment);

export default orderRouter;