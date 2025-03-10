import express  from "express"
import cors from 'cors'
import { connectDB } from "./config/db.js"
import userRouter from "./routes/userRoute.js"
import foodRouter from "./routes/foodRoute.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import dotenv from 'dotenv'
import adminRouter from "./routes/adminRoute.js";

// app config
const app = express()
const port = process.env.PORT || 5000;

// middlewares
app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

// Remove this duplicate cors line
// app.use(cors())

// db connection
connectDB()

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/food", foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/cart", cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/admin", adminRouter)
app.get("/", (req, res) => {
    res.send("API Working")
  });

dotenv.config()

app.listen(port, () => console.log(`Server started on http://localhost:${port}`))