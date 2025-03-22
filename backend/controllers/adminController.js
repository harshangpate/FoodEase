import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";

// Admin login
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt received for:", email);

    try {
        const user = await userModel.findOne({ email });
        
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.isAdmin) {
            return res.json({ success: false, message: "Admin access denied" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, isAdmin: true },
            process.env.JWT_SECRET || 'defaultsecret',
            { expiresIn: '1d' }
        );
        
        res.status(200).json({
            success: true,
            token,
            redirectUrl: '/dashboard',
            admin: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.json({ success: false, message: "Error during admin login" });
    }
};

// Register first admin (one-time setup)
const registerFirstAdmin = async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        // Check if admin already exists
        const adminExists = await userModel.findOne({ isAdmin: true });
        if (adminExists) {
            return res.json({ success: false, message: "Admin already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const newAdmin = new userModel({
            name,
            email,
            password: hashedPassword,
            isAdmin: true
        });

        await newAdmin.save();
        
        // Create token
        const token = jwt.sign(
            { id: newAdmin._id, isAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: "Admin created successfully",
            token
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error creating admin" });
    }
}

export { adminLogin, registerFirstAdmin };
