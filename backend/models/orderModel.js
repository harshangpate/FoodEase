// order model
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    items: { type: Array, required:true},
    amount: { type: Number, required: true},
    address:{type:Object,required:true},
    status: {type:String,default:"Food Processing"},
    date: {type:Date,default:Date.now()},
    payment:{type:Boolean,default:false},
    referenceId: {type: String, required: true},
    paymentVerified: {type: Boolean, default: false},
    paymentStatus: {type: String, default: 'pending'},
    paymentExpiry: {
        type: Date
    },
    verifiedAt: {
        type: Date
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin'
    },
    transactionDetails: {
        referenceId: String,
        verificationTime: Date,
        paymentMethod: String
    },
    paymentAttempts: [{
        referenceId: String,
        attemptTime: Date,
        status: String,
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'admin'
        }
    }],
    orderType: {
        type: String,
        enum: ['regular', 'rush', 'scheduled'],
        default: 'regular'
    },
    scheduledTime: {
        type: Date,
        default: null
    },
    priority: {
        type: Number,
        default: 0 // 0 for regular, 1 for rush
    },
    rushCharges: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    promocodeUsed: {
        type: String,
        default: ''
    }
});

export default mongoose.model("order", orderSchema);