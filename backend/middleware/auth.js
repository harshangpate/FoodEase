import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

// Regular user authentication middleware
const authMiddleware = async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        return res.json({success:false,message:'Not Authorized Login Again'});
    }
    try {
        const token_decode =  jwt.verify(token, process.env.JWT_SECRET);
        req.body.userId = token_decode.id;
        next();
    } catch (error) {
        return res.json({success:false,message:error.message});
    }
}

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    const { token } = req.headers;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please login.'
        });
    }
    
    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get the user from database
        const user = await userModel.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if user is admin
        if (!user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        // Set user ID on request for use in controllers
        req.userId = decoded.id;
        req.isAdmin = true;
        
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Authentication error'
            });
        }
    }
};

export { authMiddleware as default, authenticateAdmin };