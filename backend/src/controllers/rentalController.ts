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
import { getUserWaiverState } from '../utils/waiverStatus';

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
        this.generatePasscode = this.generatePasscode.bind(this);
        this.remoteUnlock = this.remoteUnlock.bind(this);
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
            const kayaks = await Kayak.find({}).sort({ createdAt: 1 });
            res.status(200).json(kayaks);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching kayaks', error });
        }
    }

    public async rentKayak(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId; // From auth middleware
        const { kayakId, kayakQuantity, rentalDuration, paymentIntentId, pickupPhoto } = req.body;

        try {
            // Check if user has a current waiver on file
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            const waiverState = await getUserWaiverState(String(userId));

            if (!waiverState.signed) {
                res.status(403).json({ 
                    success: false, 
                    message: waiverState.signedAt ? 'Please renew your liability waiver before renting' : 'Please sign the liability waiver before renting',
                    requiresWaiver: true
                });
                return;
            }

            // Verify payment was successful (optional for now - payment flow is placeholder)
            let paymentIntent = null;
            if (paymentIntentId) {
                console.log('💳 Payment intent ID provided:', paymentIntentId);
                paymentIntent = await paymentService.getPaymentIntent(paymentIntentId);

                if (paymentIntent.status !== 'succeeded') {
                    res.status(400).json({
                        success: false,
                        message: 'Payment must complete before the rental can be created'
                    });
                    return;
                }
            } else {
                console.log('⏭️  Skipping payment verification (placeholder mode)');
            }

            // Handle a single requested kayak or fall back to the next available one
            const quantity = kayakQuantity || 1;
            const rentals = [];

            let availableKayaks;

            if (kayakId) {
                const requestedKayak = await Kayak.findById(kayakId);

                if (!requestedKayak) {
                    res.status(404).json({ success: false, message: 'Kayak not found' });
                    return;
                }

                if (!requestedKayak.isAvailable) {
                    res.status(400).json({ success: false, message: 'That kayak is currently unavailable' });
                    return;
                }

                availableKayaks = [requestedKayak];
            } else {
                availableKayaks = await Kayak.find({ isAvailable: true }).limit(quantity);

                if (availableKayaks.length < quantity) {
                    res.status(400).json({ 
                        success: false, 
                        message: `Only ${availableKayaks.length} kayak(s) available. Requested ${quantity}.` 
                    });
                    return;
                }
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
                if (paymentIntent) {
                    try {
                        amount = paymentIntent.amount / 100; // Convert cents to dollars
                    } catch (error) {
                        // Fallback to calculated amount if payment intent retrieval fails
                        amount = calculateRentalAmount(rentalDuration) * quantity;
                    }
                } else {
                    // No payment intent (placeholder mode) - use calculated amount
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
        const { rentalId } = req.body;
        const isAdminReturn = req.originalUrl.includes('/admin/');
        
        // Get the file from multer (req.file is added by multer middleware)
        const file = (req as any).file;

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
            if (!file) {
                res.status(400).json({ success: false, message: 'Return photo is required' });
                return;
            }

            // Convert buffer to base64 for uploadImage
            const base64 = file.buffer.toString('base64');
            const base64String = `data:${file.mimetype};base64,${base64}`;

            // Upload return photo
            let returnPhotoUrl: string;
            try {
                returnPhotoUrl = await uploadImage(base64String, 'kayak-returns');
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

    /**
     * Generate a TTLock passcode for unlocking a kayak
     */
    public async generatePasscode(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const { kayakId } = req.body;

        try {
            console.log('🔐 Generating TTLock passcode for kayak:', kayakId);

            // Find the kayak to get its lock ID
            const kayak = await Kayak.findById(kayakId);
            if (!kayak) {
                res.status(404).json({ success: false, message: 'Kayak not found' });
                return;
            }

            console.log(`🔑 Lock ID: ${kayak.lockId}`);

            // Find active rental for this user and kayak
            const rental = await Rental.findOne({
                userId,
                kayakId,
                returnPhotoUrl: { $exists: false } // Not yet returned
            });

            if (!rental) {
                res.status(404).json({ success: false, message: 'Active rental not found' });
                return;
            }

            console.log(`📅 Rental period: ${rental.rentalStart} to ${rental.rentalEnd}`);

            // Generate passcode using TTLock service
            const ttlockService = this.getTTLockService();
            const { passcode, passcodeId } = await ttlockService.generatePasscode(
                Number(kayak.lockId),
                rental.rentalStart ? rental.rentalStart.getTime() : Date.now(),
                rental.rentalEnd ? rental.rentalEnd.getTime() : Date.now() + 3600000
            );

            console.log(`✅ Passcode generated: ${passcode} (ID: ${passcodeId})`);

            // Save passcode to rental if not already saved
            if (!rental.passcode) {
                rental.passcode = passcode;
                rental.passcodeId = passcodeId;
                await rental.save();
            }

            res.status(200).json({
                success: true,
                passcode,
                passcodeId,
                lockId: kayak.lockId,
                kayakName: kayak.name
            });
        } catch (error) {
            console.error('Error generating passcode:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to generate unlock passcode',
                error: (error as any).message 
            });
        }
    }

    public async remoteUnlock(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const { kayakId } = req.body;

        try {
            console.log('🔓 Remote unlock request for kayak:', kayakId);

            // Find the kayak to get its lock ID
            const kayak = await Kayak.findById(kayakId);
            if (!kayak) {
                res.status(404).json({ success: false, message: 'Kayak not found' });
                return;
            }

            console.log(`🔑 Lock ID: ${kayak.lockId}`);

            // Find active rental for this user and kayak
            const rental = await Rental.findOne({
                userId,
                kayakId,
                returnPhotoUrl: { $exists: false } // Not yet returned
            });

            if (!rental) {
                res.status(404).json({ success: false, message: 'No active rental found for this kayak' });
                return;
            }

            // Check if rental is still valid
            const now = new Date();
            if (now > rental.rentalEnd) {
                res.status(400).json({ success: false, message: 'Rental has expired' });
                return;
            }

            console.log(`🔐 Sending remote unlock command via TTLock API...`);

            // Call TTLock to remotely unlock the lock
            const ttlockService = this.getTTLockService();
            const unlocked = await ttlockService.remoteUnlock(Number(kayak.lockId));

            if (unlocked) {
                console.log(`✅ Remote unlock successful!`);
                res.status(200).json({
                    success: true,
                    message: 'Kayak unlocked successfully!',
                    kayakName: kayak.name
                });
            } else {
                throw new Error('Remote unlock failed');
            }
        } catch (error) {
            console.error('Error during remote unlock:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to unlock kayak remotely',
                error: (error as any).message 
            });
        }
    }
}

export default new RentalController();