import express from "express";
import { validatePromocode, createPromocode, getAllPromocodes, getActivePromocodes, togglePromoStatus, recordUsedPromocode } from "../controllers/promocodeController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Public route - validate a promocode
router.post("/validate", validatePromocode);
router.get("/active", getActivePromocodes);
// Change this line
router.patch("/toggle/:id", authMiddleware, togglePromoStatus);

// To this
router.put("/toggle/:id", authMiddleware, togglePromoStatus);
router.post("/record-usage", recordUsedPromocode);

// Admin routes - require admin authentication
router.post("/create", authMiddleware, createPromocode);
router.get("/list", authMiddleware, getAllPromocodes);

export default router;