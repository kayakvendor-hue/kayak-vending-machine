import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import User from '../models/user';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const user = await User.findById(userId);
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error verifying admin status', error });
    }
};
