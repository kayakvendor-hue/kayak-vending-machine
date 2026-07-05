import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/user';
import Waiver from '../models/waiver';
import emailService from '../services/emailService';
import { getUserWaiverState } from '../utils/waiverStatus';

class WaiverController {
    async signWaiver(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId; // From auth middleware
            const { signature } = req.body;

            if (!signature || !String(signature).trim()) {
                return res.status(400).json({ success: false, message: 'Signature is required' });
            }

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            }
            
            const user = await User.findByIdAndUpdate(
                userId,
                { waiverSigned: true },
                { new: true }
            );

            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            await Waiver.findOneAndUpdate(
                { userId },
                {
                    userId,
                    signature: String(signature).trim(),
                    dateSigned: new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );

            const waiverState = await getUserWaiverState(String(userId));

            // Send waiver confirmation email
            await emailService.sendWaiverConfirmation(
                user.email,
                user.name || (user as any).username || 'User'
            );
            
            res.status(200).json({ 
                success: true, 
                message: 'Waiver signed successfully',
                waiverSigned: waiverState.signed,
                waiverSignedAt: waiverState.signedAt,
                waiverExpiresAt: waiverState.expiresAt
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error signing waiver', error });
        }
    }

    async getWaiverStatus(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            }

            const user = await User.findById(userId).select('waiverSigned');
            
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            const waiverState = await getUserWaiverState(String(userId));
            
            res.status(200).json({ 
                success: true, 
                waiverSigned: waiverState.signed,
                waiverSignedAt: waiverState.signedAt,
                waiverExpiresAt: waiverState.expiresAt,
                isWaiverExpired: waiverState.isExpired,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error retrieving waiver status', error });
        }
    }
}

export default new WaiverController();