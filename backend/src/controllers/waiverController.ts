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

            console.log('📝 Waiver sign request from user:', userId);

            if (!userId) {
                console.log('❌ User not authenticated');
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            }
            
            console.log('🔄 Updating user record...');
            const user = await User.findByIdAndUpdate(
                userId,
                { waiverSigned: true },
                { new: true }
            );

            if (!user) {
                console.log('❌ User not found:', userId);
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            console.log('✅ User updated');

            console.log('🔄 Saving waiver record...');
            await Waiver.findOneAndUpdate(
                { userId },
                {
                    userId,
                    signature: signature || 'agreed_via_checkbox', // Use 'agreed_via_checkbox' if no signature provided
                    dateSigned: new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );

            console.log('✅ Waiver record saved');

            const waiverState = await getUserWaiverState(String(userId));

            // Send waiver confirmation email
            try {
                await emailService.sendWaiverConfirmation(
                    user.email,
                    user.name || (user as any).username || 'User'
                );
                console.log('✅ Confirmation email sent');
            } catch (emailError) {
                console.warn('⚠️ Email sending failed (non-fatal):', emailError);
            }
            
            res.status(200).json({ 
                success: true, 
                message: 'Waiver signed successfully',
                waiverSigned: waiverState.signed,
                waiverSignedAt: waiverState.signedAt,
                waiverExpiresAt: waiverState.expiresAt
            });
        } catch (error) {
            console.error('❌ Error signing waiver:', error);
            res.status(500).json({ success: false, message: 'Error signing waiver', error: (error as any).message });
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