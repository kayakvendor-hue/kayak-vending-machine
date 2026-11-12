import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/user';
import Waiver from '../models/waiver';
import emailService from '../services/emailService';
import { getUserWaiverState } from '../utils/waiverStatus';
import { safeError } from '../utils/errorResponse';
import { validateWaiverSignature, validateDateOfBirth, isAtLeastMinimumRentalAge, MINIMUM_RENTAL_AGE } from '../utils/validators';

class WaiverController {
    // Captures the one-time master waiver: drawn signature + date of birth.
    // Subsequent rentals only require a checkbox re-confirmation (see
    // rentalController.rentKayak), so this should only be called once per user.
    async signWaiver(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId; // From auth middleware
            const { signature, dateOfBirth } = req.body;

            console.log('📝 Waiver sign request from user:', userId);

            if (!userId) {
                console.log('❌ User not authenticated');
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            }

            if (!signature || !validateWaiverSignature(signature)) {
                return res.status(400).json({ success: false, message: 'A signature is required to sign the waiver' });
            }

            if (!dateOfBirth || !validateDateOfBirth(dateOfBirth)) {
                return res.status(400).json({ success: false, message: 'A valid date of birth is required to sign the waiver' });
            }

            if (!isAtLeastMinimumRentalAge(dateOfBirth)) {
                return res.status(403).json({
                    success: false,
                    message: `You must be at least ${MINIMUM_RENTAL_AGE} years old to sign the waiver and rent a kayak.`
                });
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
                    signature,
                    dateOfBirth: new Date(dateOfBirth),
                    dateSigned: new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );

            console.log('✅ Waiver record saved');

            const waiverState = await getUserWaiverState(String(userId));

            // Fire-and-forget: a slow or hung SMTP server must not delay the response
            emailService.sendWaiverConfirmation(
                user.email,
                user.name || 'User'
            )
                .then(() => console.log('✅ Confirmation email sent'))
                .catch((emailError) => console.warn('⚠️ Email sending failed (non-fatal):', emailError));

            res.status(200).json({ 
                success: true, 
                message: 'Waiver signed successfully',
                waiverSigned: waiverState.signed,
                waiverSignedAt: waiverState.signedAt,
                waiverExpiresAt: waiverState.expiresAt
            });
        } catch (error) {
            console.error('❌ Error signing waiver:', error);
            res.status(500).json({ success: false, message: 'Error signing waiver', error: safeError(error) });
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