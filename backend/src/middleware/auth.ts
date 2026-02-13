import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';

// Extend Express Request to include userId
export interface AuthRequest extends Request {
    userId?: string;
}

// Middleware to verify JWT token
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Get token from Authorization header
        // Format: "Bearer <token>"
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1]; // Remove "Bearer " prefix
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'Invalid token format' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
        
        // Add userId to request object so other routes can use it
        req.userId = decoded.userId;
        
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Middleware to require admin role
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error verifying admin access' });
    }
};
