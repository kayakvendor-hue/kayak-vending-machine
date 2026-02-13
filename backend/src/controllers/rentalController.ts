import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Rental from '../models/rental';
import Kayak from '../models/kayak';
import User from '../models/user';
import TTLockService from '../services/ttlockService';
import emailService from '../services/emailService';
import smsService from '../services/smsService';
import paymentService from '../services/paymentService';
import { uploadImage } from '../utils/imageUpload';

// Tiered pricing structure with discounts
const PRICING_TIERS = {
    1: 10,   // 1 hour: $10
    2: 18,   // 2 hours: $18 (10% discount)
    4: 32,   // 4 hours: $32 (20% discount)
    8: 50    // 8 hours: $50 (38% discount)
};

function calculateRentalAmount(durationInSeconds: number): number {
    const hours = Math.round(durationInSeconds / 3600);
    return PRICING_TIERS[hours as keyof typeof PRICING_TIERS] || hours * 10; // Fallback to $10/hour
}

class RentalController {
    private ttlockService: TTLockService | null = null;

    constructor() {
        // Bind methods to preserve 'this' context
        this.getAvailableKayaks = this.getAvailableKayaks.bind(this);
        this.rentKayak = this.rentKayak.bind(this);
        this.getRentalHistory = this.getRentalHistory.bind(this);
        this.returnKayak = this.returnKayak.bind(this);
    }

    private getTTLockService(): TTLockService {
        if (!this.ttlockService) {
            console.log('🔍 Initializing TTLockService...');
            console.log('   TTLOCK_CLIENT_ID:', process.env.TTLOCK_CLIENT_ID);
            console.log('   TTLOCK_CLIENT_SECRET:', process.env.TTLOCK_CLIENT_SECRET);
            console.log('   TTLOCK_USERNAME:', process.env.TTLOCK_USERNAME);
            console.log('   TTLOCK_PASSWORD:', process.env.TTLOCK_PASSWORD ? '***' : 'NOT SET');
            
            this.ttlockService = new TTLockService(
                'https://euapi.ttlock.com',
                process.env.TTLOCK_CLIENT_ID as string,
                process.env.TTLOCK_CLIENT_SECRET as string
            );
        }
        return this.ttlockService;
    }

    public async getAvailableKayaks(req: AuthRequest, res: Response): Promise<void> {
        try {
            const kayaks = await Kayak.find({ isAvailable: true });
            res.status(200).json(kayaks);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching kayaks', error });
        }
    }

    public async rentKayak(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId; // From auth middleware
        const { kayakId, kayakQuantity, rentalDuration, paymentIntentId, pickupPhoto } = req.body;

        try {
            // Check if user has signed waiver
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            if (!user.waiverSigned) {
                res.status(403).json({ 
                    success: false, 
                    message: 'Please sign the liability waiver before renting',
                    requiresWaiver: true
                });
                return;
            }

            // Verify payment was successful
            if (!paymentIntentId) {
                res.status(400).json({ success: false, message: 'Payment required' });
                return;
            }

            // Handle multiple kayaks if quantity is provided
            const quantity = kayakQuantity || 1;
            const rentals = [];

            // Get available kayaks
            const availableKayaks = await Kayak.find({ isAvailable: true }).limit(quantity);
            
            if (availableKayaks.length < quantity) {
                res.status(400).json({ 
                    success: false, 
                    message: `Only ${availableKayaks.length} kayak(s) available. Requested ${quantity}.` 
                });
                return;
            }

            // Calculate rental times - rentalDuration is in seconds
            const rentalStart = new Date();
            const rentalEnd = new Date(rentalStart.getTime() + (rentalDuration * 1000));
            
            console.log(`📅 Creating ${quantity} rental(s) from ${rentalStart.toLocaleString()} to ${rentalEnd.toLocaleString()}`);
            console.log(`⏱️ Duration: ${rentalDuration / 3600} hours`);
            
            // Upload optional pickup photo if provided (shared across all kayaks in this rental)
            let pickupPhotoUrl: string | undefined;
            if (pickupPhoto) {
                try {
                    pickupPhotoUrl = await uploadImage(pickupPhoto, 'kayak-pickups');
                    console.log(`📸 Pickup photo uploaded: ${pickupPhotoUrl}`);
                } catch (error) {
                    console.error('Error uploading pickup photo:', error);
                    // Don't fail the rental if photo upload fails
                }
            }

            // Create rental for each kayak
            for (const kayak of availableKayaks) {
                // Generate TTLock passcode with rental-based expiration
                let passcode: string;
                let passcodeId: number = 0;
                try {
                    const result = await this.getTTLockService().generatePasscode(
                        kayak.lockId,
                        rentalStart.getTime(),
                        rentalEnd.getTime()
                    );
                    passcode = result.passcode;
                    passcodeId = result.passcodeId;
                    console.log(`✅ Generated TTLock passcode for lock ${kayak.lockId}: ${passcode} (ID: ${passcodeId})`);
                    console.log(`🔒 Passcode will expire automatically at: ${rentalEnd.toLocaleString()}`);
                } catch (error) {
                    console.error('TTLock error, using fallback passcode:', error);
                    // Fallback to random passcode if TTLock fails
                    passcode = Math.floor(100000 + Math.random() * 900000).toString();
                }
                
                // Create the rental with payment info and optional pickup photo
                const rental: any = await Rental.create({ 
                    userId, 
                    kayakId: kayak._id, 
                    rentalStart, 
                    rentalEnd, 
                    passcode,
                    passcodeId,
                    paymentIntentId,
                    paymentStatus: 'succeeded',
                    pickupPhotoUrl 
                });

                // Mark kayak as unavailable
                kayak.isAvailable = false;
                await kayak.save();

                rentals.push({
                    _id: rental._id.toString(),
                    passcode: passcode,
                    kayakName: kayak.name,
                    kayakLocation: kayak.location,
                    rentalEnd: rentalEnd.toISOString()
                });

                console.log(`✅ Rental created for kayak ${kayak.name} (${kayak._id})`);
            }

            // Send confirmation email/SMS for first kayak (or summary)

            // Get user details for notifications (already loaded from waiver check)
            if (user && rentals.length > 0) {
                // Calculate rental amount from payment or use tiered pricing
                let amount: number;
                try {
                    const paymentIntent = await paymentService.getPaymentIntent(paymentIntentId);
                    amount = paymentIntent.amount / 100; // Convert cents to dollars
                } catch (error) {
                    // Fallback to calculated amount if payment intent retrieval fails
                    amount = calculateRentalAmount(rentalDuration) * quantity;
                }

                const firstKayak = rentals[0];

                // Send email confirmation
                await emailService.sendRentalConfirmation(
                    user.email,
                    user.name || user.username || 'User',
                    quantity > 1 ? `${quantity} kayaks` : firstKayak.kayakName,
                    firstKayak.passcode,
                    rentalEnd,
                    amount
                );

                // Send SMS confirmation if phone number exists
                if (user.phone) {
                    await smsService.sendRentalConfirmation(
                        user.phone,
                        quantity > 1 ? `${quantity} kayaks` : firstKayak.kayakName,
                        firstKayak.passcode,
                        rentalEnd
                    );
                }
            }

            res.status(200).json({ success: true, rentals, rentalEnd });
        } catch (error) {
            console.error('Error renting kayak:', error);
            res.status(500).json({ success: false, message: 'Error renting kayak', error });
        }
    }

    public async getRentalHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            const rentals = await Rental.find({ userId }).populate('kayakId').sort({ createdAt: -1 });
            res.status(200).json({ success: true, rentals });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching rental history', error });
        }
    }

    public async returnKayak(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const { rentalId, returnPhoto } = req.body;
        const isAdminReturn = req.originalUrl.includes('/admin/');

        try {
            // Find the rental
            const rental = await Rental.findById(rentalId).populate('kayakId');
            if (!rental) {
                res.status(404).json({ success: false, message: 'Rental not found' });
                return;
            }

            // Check if kayak has already been returned
            if (rental.returnPhotoUrl) {
                res.status(400).json({ success: false, message: 'Kayak has already been returned' });
                return;
            }

            // Verify this rental belongs to the user (skip check for admin)
            if (!isAdminReturn && rental.userId.toString() !== userId) {
                res.status(403).json({ success: false, message: 'Not authorized to return this rental' });
                return;
            }

            // Require return photo
            if (!returnPhoto) {
                res.status(400).json({ success: false, message: 'Return photo is required' });
                return;
            }

            // Upload return photo
            let returnPhotoUrl: string;
            try {
                returnPhotoUrl = await uploadImage(returnPhoto, 'kayak-returns');
                console.log(`📸 Return photo uploaded: ${returnPhotoUrl}`);
            } catch (error) {
                console.error('Error uploading return photo:', error);
                res.status(500).json({ success: false, message: 'Failed to upload return photo' });
                return;
            }

            // Save return photo URL to rental
            rental.returnPhotoUrl = returnPhotoUrl;
            await rental.save();

            // Check if passcode has already expired naturally
            const now = new Date();
            const kayak = rental.kayakId as any;
            
            if (rental.rentalEnd && now > rental.rentalEnd) {
                console.log(`✅ Passcode already expired at ${rental.rentalEnd.toLocaleString()}`);
            } else if (rental.passcodeId && rental.passcodeId > 0) {
                // Try to delete the passcode early (requires gateway)
                // If no gateway is available, passcode will remain active until rentalEnd
                try {
                    console.log(`🗑️ Attempting to delete TTLock passcode ${rental.passcodeId} from lock ${kayak.lockId}`);
                    const deleted = await this.getTTLockService().deletePasscode(kayak.lockId, rental.passcodeId);
                    if (deleted) {
                        console.log(`✅ Passcode successfully deleted from lock`);
                    } else {
                        console.log(`⚠️ Could not delete passcode (requires gateway). It will auto-expire at ${rental.rentalEnd?.toLocaleString()}`);
                    }
                } catch (error) {
                    console.log(`⚠️ Passcode deletion failed (no gateway). It will auto-expire at ${rental.rentalEnd?.toLocaleString()}`);
                }
            }

            // Mark kayak as available again
            await Kayak.findByIdAndUpdate(rental.kayakId, { isAvailable: true });

            console.log(`Kayak ${rental.kayakId} returned and marked as available`);

            // Get user details for notifications
            const user = await User.findById(userId);
            if (user) {
                // Send email confirmation
                await emailService.sendReturnConfirmation(
                    user.email,
                    user.name || user.username || 'User',
                    kayak.name
                );

                // Send SMS confirmation if phone number exists
                if (user.phone) {
                    await smsService.sendReturnConfirmation(
                        user.phone,
                        kayak.name
                    );
                }
            }

            res.status(200).json({ success: true, message: 'Kayak returned successfully' });
        } catch (error) {
            console.error('Error returning kayak:', error);
            res.status(500).json({ success: false, message: 'Error returning kayak', error });
        }
    }

    public async updatePickupPhoto(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            const { rentalId, pickupPhoto } = req.body;

            if (!pickupPhoto) {
                res.status(400).json({ success: false, message: 'Pickup photo is required' });
                return;
            }

            // Find the rental and verify ownership
            const rental = await Rental.findById(rentalId);
            if (!rental) {
                res.status(404).json({ success: false, message: 'Rental not found' });
                return;
            }

            if (rental.userId.toString() !== userId) {
                res.status(403).json({ success: false, message: 'Not authorized to update this rental' });
                return;
            }

            // Upload photo to Cloudinary
            const pickupPhotoUrl = await uploadImage(pickupPhoto, 'kayak-pickups');
            
            // Update rental with pickup photo
            rental.pickupPhotoUrl = pickupPhotoUrl;
            await rental.save();

            res.status(200).json({ 
                success: true, 
                message: 'Pickup photo updated successfully',
                pickupPhotoUrl 
            });
        } catch (error) {
            console.error('Error updating pickup photo:', error);
            res.status(500).json({ success: false, message: 'Error updating pickup photo', error });
        }
    }
}

export default new RentalController();