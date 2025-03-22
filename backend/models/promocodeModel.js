import mongoose from "mongoose";

const promocodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isWelcomeCode: {
        type: Boolean,
        default: false
      },
    expiryDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

const promocodeModel = mongoose.model("Promocode", promocodeSchema);

export default promocodeModel;