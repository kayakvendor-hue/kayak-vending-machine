import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/user';
import emailService from '../services/emailService';

class WaiverController {
    async signWaiver(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId; // From auth middleware
            
            // Update user's waiverSigned status
            const user = await User.findByIdAndUpdate(
                userId, 
                { waiverSigned: true },
                { new: true }
            );
            
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            // Send waiver confirmation email
            await emailService.sendWaiverConfirmation(user.email, user.name || user.username);
            
            res.status(200).json({ 
                success: true, 
                message: 'Waiver signed successfully',
                waiverSigned: true
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error signing waiver', error });
        }
    }

    async getWaiverStatus(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            const user = await User.findById(userId).select('waiverSigned');
            
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            
            res.status(200).json({ 
                success: true, 
                waiverSigned: user.waiverSigned 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error retrieving waiver status', error });
        }
    }
}

export default new WaiverController();