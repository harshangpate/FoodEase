import express from 'express';
import { adminLogin, registerFirstAdmin} from '../controllers/adminController.js';

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/register-first-admin", registerFirstAdmin);

export default adminRouter;
 