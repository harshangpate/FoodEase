import express from 'express';
import cors from 'cors';
import { connectDB } from "./config/db.js"
import userRouter from "./routes/userRoute.js"
import foodRouter from "./routes/foodRoute.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import promocodeRoute from './routes/promocodeRoute.js';
import dotenv from 'dotenv'
import adminRouter from "./routes/adminRoute.js";
import userManagementRouter from "./routes/userManagementRoute.js";
import reportRouter from "./routes/reportRoute.js";
import { scheduleMonthlyReports } from "./controllers/reportController.js";
import cron from 'node-cron';

// app config
const app = express()
const port = process.env.PORT || 5000;

// middlewares
app.use(express.json())
// Update CORS configuration
const allowedOrigins = [
  // Local development
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://[::1]:5173', 
  'http://[::1]:5174',
  // Render deployed frontends (update these URLs after deployment)
  'https://foodease-frontend.onrender.com',
  'https://foodease-admin.onrender.com',
  // Netlify deployed frontends (will add specific URLs after deployment)
  'https://foodease-frontend.netlify.app',
  'https://foodease-admin.netlify.app',
  // Allow all Netlify domains during development
  '.netlify.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

// db connection
connectDB()

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    message: "FoodEase API is running", 
    time: new Date().toISOString()
  });
});

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/food", foodRouter)
app.use("/images", express.static('uploads'))
app.use("/api/cart", cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/admin", adminRouter)
app.use('/api/promocode', promocodeRoute);
app.use('/api/user-management', userManagementRouter);
app.use('/api/reports', reportRouter);
app.get("/", (req, res) => {
    res.send("API Working")
  });

dotenv.config()

// Schedule monthly reports on the 1st day of each month at 1:00 AM
cron.schedule('0 1 1 * *', async () => {
  console.log('Running monthly report generation task...');
  try {
    await scheduleMonthlyReports();
    console.log('Monthly reports generated successfully');
  } catch (error) {
    console.error('Error generating monthly reports:', error);
  }
});

app.listen(port, () => console.log(`Server started on http://localhost:${port}`))