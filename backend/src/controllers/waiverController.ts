import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/user';
import Waiver from '../models/waiver';
import emailService from '../services/emailService';
import { getUserWaiverState } from '../utils/waiverStatus';
import { safeError } from '../utils/errorResponse';
import { validateWaiverSignature, validateDateOfBirth, isAtLeastMinimumRentalAge, MINIMUM_RENTAL_AGE } from '../utils/validators';
import { buildSignedWaiverPdf, WaiverFormInput } from '../utils/waiverPdf';

const MAX_MINORS = 3;
const MAX_FIELD_LENGTH = 200;
const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';

const isNonEmptyText = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0 && value.trim().length <= MAX_FIELD_LENGTH;

// Checks the waiver form fields collected by the Rent page. Returns an error message, or null when valid.
const validateWaiverForm = (form: any): string | null => {
    if (!form || typeof form !== 'object') return 'Please complete the waiver form';
    const requiredFields: [string, string][] = [
        ['renterName', 'Full name'],
        ['address', 'Address'],
        ['phone', 'Phone number'],
        ['email', 'Email'],
        ['emergencyName', 'Emergency contact name'],
        ['emergencyRelationship', 'Emergency contact relationship'],
        ['emergencyPhone', 'Emergency contact phone'],
    ];
    for (const [key, label] of requiredFields) {
        if (!isNonEmptyText(form[key])) return `${label} is required on the waiver`;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'A valid email is required on the waiver';

    const minors = form.minors ?? [];
    if (!Array.isArray(minors) || minors.length > MAX_MINORS) {
        return `The waiver can list up to ${MAX_MINORS} minors`;
    }
    for (let i = 0; i < minors.length; i++) {
        const minor = minors[i];
        if (!isNonEmptyText(minor?.name)) return `Please enter a name for minor #${i + 1}`;
        if (!minor.dateOfBirth || !validateDateOfBirth(minor.dateOfBirth)) return `Please enter a valid date of birth for minor #${i + 1}`;
        if (isAtLeastMinimumRentalAge(minor.dateOfBirth)) return `Minor #${i + 1} must be under ${MINIMUM_RENTAL_AGE}. Adults must sign for themselves.`;
    }

    if (minors.length > 0) {
        const guardian = form.guardian;
        if (!guardian) return 'A parent or guardian must complete the minor section of the waiver';
        if (!isNonEmptyText(guardian.name)) return 'Guardian name is required on the waiver';
        if (!isNonEmptyText(guardian.relationship)) return 'Guardian relationship to the minor(s) is required';
        if (!isNonEmptyText(guardian.phone)) return 'Guardian phone number is required';
        if (typeof guardian.signature !== 'string' || !guardian.signature.startsWith(PNG_DATA_URL_PREFIX)) {
            return 'A parent or guardian signature is required for the minor(s)';
        }
    }
    return null;
};

const normalizeWaiverForm = (form: any): WaiverFormInput => ({
    renterName: form.renterName.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    emergencyName: form.emergencyName.trim(),
    emergencyRelationship: form.emergencyRelationship.trim(),
    emergencyPhone: form.emergencyPhone.trim(),
    minors: (form.minors ?? []).map((m: any) => ({ name: m.name.trim(), dateOfBirth: m.dateOfBirth })),
    guardian: form.minors?.length && form.guardian ? {
        name: form.guardian.name.trim(),
        relationship: form.guardian.relationship.trim(),
        phone: form.guardian.phone.trim(),
        signature: form.guardian.signature,
    } : undefined,
});

class WaiverController {
    // Captures the one-time master waiver: drawn signature, date of birth, and the
    // completed waiver form, which is filled into the waiver PDF and stored.
    // Subsequent rentals only require a checkbox re-confirmation (see
    // rentalController.rentKayak), so this should only be called once per user.
    async signWaiver(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId; // From auth middleware
            const { signature, dateOfBirth, form } = req.body;

            console.log('📝 Waiver sign request from user:', userId);

            if (!userId) {
                console.log('❌ User not authenticated');
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            }

            if (!signature || !validateWaiverSignature(signature) || !signature.startsWith(PNG_DATA_URL_PREFIX)) {
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

            const formError = validateWaiverForm(form);
            if (formError) {
                return res.status(400).json({ success: false, message: formError });
            }

            // Build the PDF before marking the account as signed, so a PDF failure can't leave a half-signed account.
            console.log('🔄 Filling waiver PDF...');
            const signedPdf = await buildSignedWaiverPdf(normalizeWaiverForm(form), signature);

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
                    signedPdf,
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

    async downloadWaiverPdf(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            }

            const waiver = await Waiver.findOne({ userId }).select('+signedPdf').sort({ dateSigned: -1 });
            if (!waiver?.signedPdf) {
                return res.status(404).json({ success: false, message: 'No signed waiver PDF on file' });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="KayakVendor_Waiver.pdf"');
            res.status(200).send(waiver.signedPdf);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error downloading waiver', error: safeError(error) });
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