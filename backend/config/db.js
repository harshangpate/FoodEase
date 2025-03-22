import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/FoodEase')
        console.log("DB Connected");
    } catch (error) {
        console.error("DB Connection Error:", error);
    }
}


// add your mongoDB connection string above.
// Do not use '@' symbol in your databse user's password else it will show an error.