// user model
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    parentEmail: { type: String, required: false },
    password: { type: String, required: true },
    phone: { type: String, required: false },
    isAdmin: { type: Boolean, default: false },
    usedPromocodes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promocode'
      }],
    cartData:{type:Object,default:{}}
}, { minimize: false, timestamps: true })

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;