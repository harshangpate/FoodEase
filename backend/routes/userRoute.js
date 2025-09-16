import express from 'express';
import { loginUser, registerUser } from '../controllers/userController.js';
import { getUserProfile, updateUserProfile } from '../controllers/profileController.js';
import { verifyToken } from '../middleware/auth.js';
const userRouter = express.Router();

userRouter.post("/register",registerUser);
userRouter.post("/login",loginUser);

// Profile routes
userRouter.get("/profile", verifyToken, getUserProfile);
userRouter.put("/update-profile", verifyToken, updateUserProfile);

export default userRouter;