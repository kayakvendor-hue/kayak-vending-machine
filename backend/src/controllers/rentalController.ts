import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Rental from '../models/rental';
import Waiver from '../models/waiver';
import Kayak from '../models/kayak';
import Lock from '../models/lock';
import User from '../models/user';
import TTLockService from '../services/ttlockService';
import emailService from '../services/emailService';
import smsService from '../services/smsService';
import paymentService from '../services/paymentService';
import { uploadImage } from '../utils/imageUpload';
import { getUserWaiverState } from '../utils/waiverStatus';
import { buildRentalWaiverPdf, buildAdultRiderWaiverPdf } from '../utils/waiverPdf';
import { MINIMUM_RENTAL_AGE, validateDateOfBirth, validateWaiverSignature, isAtLeastMinimumRentalAge } from '../utils/validators';
import { safeError } from '../utils/errorResponse';

// Tiered pricing structure with discounts
const PRICING_TIERS = {
    1: 10,   // 1 hour: $10
    2: 18,   // 2 hours: $18 (10% discount)
    4: 32,   // 4 hours: $32 (20% discount)
    8: 50    // 8 hours: $50 (38% discount)
};

export function calculateRentalAmount(durationInSeconds: number): number {
    const hours = Math.round(durationInSeconds / 3600);
    return PRICING_TIERS[hours as keyof typeof PRICING_TIERS] || hours * 10; // Fallback to $10/hour
}

class RentalController {
    private ttlockService: TTLockService | null = null;

    constructor() {
        // Bind methods to preserve 'this' context
        this.getAvailableKayaks = this.getAvailableKayaks.bind(this);
        this.prePaymentHealthCheck = this.prePaymentHealthCheck.bind(this);
        this.rentKayak = this.rentKayak.bind(this);
        this.getRentalHistory = this.getRentalHistory.bind(this);
        this.getMyRentalWaiverPdf = this.getMyRentalWaiverPdf.bind(this);
        this.getMyRentalRiderWaiverPdf = this.getMyRentalRiderWaiverPdf.bind(this);
        this.returnKayak = this.returnKayak.bind(this);
        this.remoteUnlock = this.remoteUnlock.bind(this);
        this.getLockStatus = this.getLockStatus.bind(this);
        this.getLockBattery = this.getLockBattery.bind(this);
        this.diagnosticCheckLock = this.diagnosticCheckLock.bind(this);
        this.getGatewayStatus = this.getGatewayStatus.bind(this);
    }

    private getTTLockService(): TTLockService {
        if (!this.ttlockService) {
            console.log('🔍 Initializing TTLockService...');
            console.log('   TTLOCK_CLIENT_ID:', process.env.TTLOCK_CLIENT_ID ? '***' : 'NOT SET');
            console.log('   TTLOCK_CLIENT_SECRET:', process.env.TTLOCK_CLIENT_SECRET ? '***' : 'NOT SET');
            console.log('   TTLOCK_USERNAME:', process.env.TTLOCK_USERNAME ? '***' : 'NOT SET');
            console.log('   TTLOCK_PASSWORD:', process.env.TTLOCK_PASSWORD ? '***' : 'NOT SET');
            console.log('   TTLOCK_API_URL:', process.env.TTLOCK_API_URL || 'https://euapi.ttlock.com (default)');
            
            this.ttlockService = new TTLockService(
                process.env.TTLOCK_API_URL || 'https://euapi.ttlock.com',
                process.env.TTLOCK_CLIENT_ID as string,
                process.env.TTLOCK_CLIENT_SECRET as string
            );
        }
        return this.ttlockService;
    }

    public async getAvailableKayaks(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Only return kayaks that are available (gateway status is checked at rental time)
            const kayaks = await Kayak.find({ isAvailable: true }).sort({ createdAt: 1 });
            res.status(200).json(kayaks);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching kayaks', error });
        }
    }

    public async getGatewayStatus(req: AuthRequest, res: Response): Promise<void> {
        const online = await this.getTTLockService().isGatewayOnline(2245851);
        res.status(200).json({ success: true, online });
    }

    /**
     * Pre-payment gateway health check
     * User calls this when they click "Continue to Payment"
     * Verifies gateway is online and selected kayaks are rentable
     */
    public async prePaymentHealthCheck(req: AuthRequest, res: Response): Promise<void> {
        const { kayakIds } = req.body;

        try {
            if (!kayakIds || !Array.isArray(kayakIds) || kayakIds.length === 0) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Kayak IDs required' 
                });
                return;
            }

            console.log(`\n🔍 Pre-payment health check for kayaks: ${kayakIds.join(', ')}`);

            // Verify all requested kayaks exist and are available
            const kayaks = await Kayak.find({ _id: { $in: kayakIds } });

            if (kayaks.length !== kayakIds.length) {
                res.status(400).json({ 
                    success: false, 
                    message: 'One or more kayaks not found' 
                });
                return;
            }

            // Check if any kayak is already rented
            const unavailableKayaks = kayaks.filter((k: any) => !k.isAvailable);
            if (unavailableKayaks.length > 0) {
                res.status(400).json({ 
                    success: false, 
                    message: `${unavailableKayaks.map((k: any) => k.name).join(', ')} already rented` 
                });
                return;
            }

            // Same gateway online check as the admin Test Now button
            const ttlockService = this.getTTLockService();
            const GATEWAY_ID = 2245851; // Kayak G4 gateway ID from TTLock
            const gatewayOnline = await ttlockService.isGatewayOnline(GATEWAY_ID);

            if (!gatewayOnline) {
                res.status(503).json({ 
                    success: false, 
                    message: 'Gateway is currently offline. Unable to proceed with rental. Please try again later.',
                    retryable: true
                });
                return;
            }

            console.log(`🟢 Pre-payment check PASSED - gateway online and kayaks available\n`);

            res.status(200).json({ 
                success: true, 
                message: 'Gateway is online and kayaks are ready. Proceed to payment.',
                kayaksVerified: kayakIds
            });
        } catch (error: any) {
            console.error('❌ Pre-payment health check error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error checking gateway status',
                error: safeError(error) 
            });
        }
    }

    public async rentKayak(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId; // From auth middleware
        const { kayakId, kayakQuantity, rentalDuration, paymentIntentId, pickupPhoto, waiverConfirmedAt, additionalRiders, guardianSignatureForMinors, guardianDetails } = req.body;

        try {
            // Check if user has a current waiver on file
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            const waiverState = await getUserWaiverState(String(userId));

            if (!user.safetyVideoWatchedAt) {
                res.status(403).json({
                    success: false,
                    message: 'Please watch the safety video before renting',
                    requiresSafetyVideo: true
                });
                return;
            }

            if (!waiverState.signed) {
                res.status(403).json({ 
                    success: false, 
                    message: 'Please sign the liability waiver before renting',
                    requiresWaiver: true
                });
                return;
            }

            // Defense-in-depth: signWaiver already blocks under-18 signers, but this
            // re-checks age against the stored date of birth in case of older records.
            if (!waiverState.isAdult) {
                res.status(403).json({
                    success: false,
                    message: `You must be at least ${MINIMUM_RENTAL_AGE} years old to rent a kayak.`
                });
                return;
            }

            // waiverConfirmedAt is sent by the frontend once the renter re-confirms the
            // waiver checkbox for this rental; parsed/stamped server-side for the audit trail.
            const parsedWaiverConfirmedAt = waiverConfirmedAt && !isNaN(new Date(waiverConfirmedAt).getTime())
                ? new Date(waiverConfirmedAt)
                : new Date();

            // Handle a single requested kayak or fall back to the next available one
            const quantity = kayakQuantity || 1;

            // For multi-kayak rentals, anyone besides the account holder must be accounted
            // for: children (name only, covered by the guardian's signature) or adults
            // (their own signature + date of birth, since they're responsible for themselves).
            const ridersInput = Array.isArray(additionalRiders) ? additionalRiders : [];
            let hasChildRider = false;

            if (quantity > 1) {
                if (ridersInput.length !== quantity - 1) {
                    res.status(400).json({
                        success: false,
                        message: `Please provide rider details for all ${quantity - 1} additional kayak(s).`
                    });
                    return;
                }

                for (let i = 0; i < ridersInput.length; i++) {
                    const rider = ridersInput[i];
                    if (rider?.riderType === 'child') {
                        hasChildRider = true;
                        if (!rider.name || !String(rider.name).trim()) {
                            res.status(400).json({ success: false, message: `Please enter a name for child rider #${i + 1}.` });
                            return;
                        }
                        if (!rider.dateOfBirth || !validateDateOfBirth(rider.dateOfBirth)) {
                            res.status(400).json({ success: false, message: `Please provide a valid date of birth for child rider #${i + 1}.` });
                            return;
                        }
                        if (isAtLeastMinimumRentalAge(rider.dateOfBirth)) {
                            res.status(400).json({ success: false, message: `Child rider #${i + 1} must be under 18. Adults must sign their own waiver.` });
                            return;
                        }
                    } else if (rider?.riderType === 'adult') {
                        if (!rider.dateOfBirth || !validateDateOfBirth(rider.dateOfBirth)) {
                            res.status(400).json({ success: false, message: `Please provide a valid date of birth for adult rider #${i + 1}.` });
                            return;
                        }
                        if (!isAtLeastMinimumRentalAge(rider.dateOfBirth)) {
                            res.status(403).json({ success: false, message: `Adult rider #${i + 1} must be at least ${MINIMUM_RENTAL_AGE} years old to rent a kayak.` });
                            return;
                        }
                        if (!rider.signature || !validateWaiverSignature(rider.signature)) {
                            res.status(400).json({ success: false, message: `Please provide a signature for adult rider #${i + 1}.` });
                            return;
                        }
                        const adultRenter = rider.renter;
                        if (!adultRenter || !adultRenter.fullName?.trim() || !adultRenter.address?.trim() || !adultRenter.phone?.trim() ||
                            !adultRenter.email?.trim() || !adultRenter.emergencyContact?.name?.trim() ||
                            !adultRenter.emergencyContact?.relationship?.trim() || !adultRenter.emergencyContact?.phone?.trim()) {
                            res.status(400).json({ success: false, message: `Please complete all contact details for adult rider #${i + 1}.` });
                            return;
                        }
                    } else {
                        res.status(400).json({ success: false, message: `Invalid rider type for rider #${i + 1}.` });
                        return;
                    }
                }

                if (hasChildRider && (!guardianSignatureForMinors || !validateWaiverSignature(guardianSignatureForMinors))) {
                    res.status(400).json({ success: false, message: 'A parent/guardian signature is required for the child rider(s) listed.' });
                    return;
                }

                if (hasChildRider && (!guardianDetails?.fullName?.trim() || !guardianDetails?.relationship?.trim() || !guardianDetails?.phone?.trim())) {
                    res.status(400).json({ success: false, message: 'Parent/guardian name, relationship, and phone are required for the child rider(s) listed.' });
                    return;
                }
            }

            const ridersToStore = ridersInput.map((rider: any) => ({
                riderType: rider.riderType,
                name: rider.riderType === 'child' ? String(rider.name).trim() : undefined,
                dateOfBirth: new Date(rider.dateOfBirth),
                signature: rider.riderType === 'adult' ? rider.signature : undefined,
                renter: rider.riderType === 'adult' ? {
                    fullName: rider.renter.fullName.trim(),
                    address: rider.renter.address.trim(),
                    phone: rider.renter.phone.trim(),
                    email: rider.renter.email.trim(),
                    emergencyContact: {
                        name: rider.renter.emergencyContact.name.trim(),
                        relationship: rider.renter.emergencyContact.relationship.trim(),
                        phone: rider.renter.emergencyContact.phone.trim()
                    }
                } : undefined,
                dateSigned: new Date()
            }));

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
                        message: `Only ${availableKayaks.length} kayak(s) available. Requested ${quantity}.`,
                        hint: 'If few kayaks are available, the gateway may be offline. Please try again shortly.'
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
                // Make sure the kayak is still available before creating its rental
                const currentKayakStatus = await Kayak.findById(kayak._id);
                if (!currentKayakStatus?.isAvailable) {
                    console.warn(`⚠️ Kayak ${kayak.name} was rented during checkout`);
                    res.status(400).json({
                        success: false,
                        message: `${kayak.name} was just rented. Please select another kayak or try again.`
                    });
                    return;
                }

                // Get locks from the Lock collection
                let kayakLock = null;
                let lifevestLock = null;

                // KAYAK LOCK - Query by kayak's lockDesignation
                if (kayak.lockDesignation) {
                    kayakLock = await Lock.findOne({ 
                        designation: kayak.lockDesignation,
                        status: { $in: ['available', 'in-use'] }
                    });
                    
                    if (!kayakLock) {
                        console.warn(`⚠️ No kayak lock found for designation: ${kayak.lockDesignation}`);
                    }
                }

                // LIFEVEST/PADDLE LOCK - Get from "Lifejacket Box"
                lifevestLock = await Lock.findOne({
                    designation: 'Lifejacket Box',
                    status: 'available'
                });

                if (!lifevestLock) {
                    console.warn(`⚠️ Storage Box not available or not found`);
                }
                
                // Create the rental with lock IDs only
                const rental: any = await Rental.create({ 
                    userId, 
                    kayakId: kayak._id, 
                    rentalStart, 
                    rentalEnd, 
                    kayakLockId: kayakLock?.lockId || undefined,
                    lifevestLockId: lifevestLock?.lockId || undefined,
                    paymentIntentId,
                    paymentStatus: 'succeeded',
                    pickupPhotoUrl,
                    waiverConfirmedAt: parsedWaiverConfirmedAt,
                    additionalRiders: ridersToStore.length > 0 ? ridersToStore : undefined,
                    guardianSignatureForMinors: hasChildRider ? guardianSignatureForMinors : undefined,
                    guardianDetails: hasChildRider ? {
                        fullName: guardianDetails.fullName.trim(),
                        relationship: guardianDetails.relationship.trim(),
                        phone: guardianDetails.phone.trim()
                    } : undefined
                });

                // Update lock status if locks are assigned
                if (kayakLock) {
                    kayakLock.status = 'in-use';
                    kayakLock.currentRentalId = rental._id;
                    await kayakLock.save();
                }

                // Storage Box (lifevestLock) is shared - DO NOT update its status
                if (lifevestLock) {
                    console.log(`✅ Storage Box lock associated (lock remains available for other rentals)`);
                }

                // Mark kayak as unavailable
                kayak.isAvailable = false;
                await kayak.save();

                rentals.push({
                    _id: rental._id.toString(),
                    kayakName: kayak.name,
                    kayakLocation: kayak.location,
                    rentalEnd: rentalEnd.toISOString(),
                    kayakLockId: kayakLock?.lockId || undefined,
                    lifevestLockId: lifevestLock?.lockId || undefined
                });

                console.log(`✅ Rental created for kayak ${kayak.name} (${kayak._id})`);
            }

            // Send confirmation email/SMS for all kayaks

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

                const kayakNames = rentals.map(r => r.kayakName).join(', ');

                // Send notifications in the background - don't block the response on slow email/SMS providers
                emailService.sendRentalConfirmation(
                    user.email,
                    user.name || 'User',
                    kayakNames,
                    rentalEnd,
                    amount,
                    rentals
                ).catch(err => console.error('Error sending rental confirmation email:', err));

                if (user.phone) {
                    smsService.sendRentalConfirmation(
                        user.phone,
                        kayakNames,
                        rentalEnd,
                        rentals
                    ).catch(err => console.error('Error sending rental confirmation SMS:', err));
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

    public async getMyRentalWaiverPdf(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            const { rentalId } = req.params;

            const rental = await Rental.findOne({ _id: rentalId, userId });
            if (!rental) {
                res.status(404).json({ success: false, message: 'Rental not found' });
                return;
            }

            const waiver = await Waiver.findOne({ userId }).sort({ dateSigned: -1 });
            if (!waiver) {
                res.status(404).json({ success: false, message: 'No waiver on file for this user' });
                return;
            }

            const pdfBytes = await buildRentalWaiverPdf(rental, waiver);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="waiver-${rentalId}.pdf"`);
            res.status(200).send(Buffer.from(pdfBytes));
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error generating waiver PDF', error: safeError(error) });
        }
    }

    public async getMyRentalRiderWaiverPdf(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            const { rentalId, index } = req.params;

            const rental = await Rental.findOne({ _id: rentalId, userId });
            if (!rental) {
                res.status(404).json({ success: false, message: 'Rental not found' });
                return;
            }

            const rider = rental.additionalRiders?.[Number(index)];
            if (!rider || rider.riderType !== 'adult' || !rider.renter) {
                res.status(404).json({ success: false, message: 'Adult rider not found on this rental' });
                return;
            }

            const pdfBytes = await buildAdultRiderWaiverPdf({
                renter: rider.renter,
                signature: rider.signature,
                dateSigned: rider.dateSigned
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="waiver-${rentalId}-rider-${index}.pdf"`);
            res.status(200).send(Buffer.from(pdfBytes));
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error generating rider waiver PDF', error: safeError(error) });
        }
    }

    public async getActiveRentals(req: AuthRequest, res: Response): Promise<void> {
        try {
            const activeRentals = await Rental.find({
                $and: [
                    { returnPhotoUrl: { $in: [null, '', undefined] } },
                    { rentalStatus: { $ne: 'completed' } }
                ]
            })
                .populate('userId', 'email name phone')
                .populate('kayakId')
                .sort({ rentalEnd: 1 });
            
            res.status(200).json(activeRentals);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching active rentals', error });
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

            console.log(`📝 Return request for rental ${rentalId}`);
            console.log(`   Current rentalStatus: ${rental.rentalStatus}`);
            console.log(`   Has returnPhotoUrl: ${!!rental.returnPhotoUrl}`);

            // Check if kayak has already been returned (either by status or photo)
            if (rental.rentalStatus === 'completed' || rental.returnPhotoUrl) {
                res.status(400).json({ success: false, message: 'Kayak has already been returned' });
                return;
            }

            // Verify this rental belongs to the user (skip check for admin)
            if (!isAdminReturn && rental.userId.toString() !== userId) {
                res.status(403).json({ success: false, message: 'Not authorized to return this rental' });
                return;
            }

            // Upload return photo if provided (optional for testing)
            // Supports both: FormData file upload (multer) OR base64 JSON body
            let photoToUpload: string | null = null;
            
            if (file) {
                // MultiPart file upload (from StaffReturn.tsx)
                const base64 = file.buffer.toString('base64');
                photoToUpload = `data:${file.mimetype};base64,${base64}`;
                console.log(`📁 Received return photo via FormData (${file.size} bytes)`);
            } else if (req.body.returnPhoto) {
                // Base64 JSON body (from Account.tsx, Admin.tsx)
                photoToUpload = req.body.returnPhoto;
                console.log(`📷 Received return photo via JSON body (base64)`);
            }
            
            if (photoToUpload) {
                try {
                    console.log(`🔧 Uploading to Cloudinary with config:`, {
                        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                        api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'MISSING',
                        api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'MISSING'
                    });
                    
                    const returnPhotoUrl = await uploadImage(photoToUpload, 'kayak-returns');
                    console.log(`📸 Return photo uploaded: ${returnPhotoUrl}`);
                    
                    // Save return photo URL to rental
                    rental.returnPhotoUrl = returnPhotoUrl;
                    await rental.save();
                } catch (error) {
                    console.error('❌ Return photo upload failed:', error);
                    console.error('Cloudinary config:', {
                        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                        api_key_set: !!process.env.CLOUDINARY_API_KEY,
                        api_secret_set: !!process.env.CLOUDINARY_API_SECRET
                    });
                    // Don't fail the return just because photo upload failed
                }
            } else {
                console.log(`ℹ️ No return photo provided - skipping for testing`);
            }

            const now = new Date();
            const kayak = rental.kayakId as any;
            
            // Get the locks used in this rental
            let kayakLock = null;
            let lifevestLock = null;

            if (rental.kayakLockId) {
                kayakLock = await Lock.findOne({ lockId: rental.kayakLockId });
            }
            if (rental.lifevestLockId) {
                lifevestLock = await Lock.findOne({ lockId: rental.lifevestLockId });
            }
            
            // Remote unlock is via gateway; nothing to clean up on the locks

            // Mark rental as completed
            console.log(`🔴 Marking rental as COMPLETED...`);
            rental.rentalStatus = 'completed';
            const savedRental = await rental.save();

            console.log(`🔴 RENTAL MARKED AS COMPLETED`);
            console.log(`   Rental ID: ${rental._id}`);
            console.log(`   Status in memory: ${rental.rentalStatus}`);
            console.log(`   Status from save: ${savedRental.rentalStatus}`);
            
            // Release locks back to available pool
            if (kayakLock) {
                kayakLock.status = 'available';
                kayakLock.currentRentalId = undefined;
                await kayakLock.save();
                console.log(`✅ Kayak lock released to pool: ${kayakLock.designation}`);
            }

            // Storage Box (lifevestLock) is shared - DO NOT update its status
            // It remains available for other active rentals
            if (lifevestLock) {
                console.log(`✅ Storage Box lock remains available`);
                // DO NOT modify lifevestLock status - it's shared across all rentals
            }
            
            // Verify it was saved by re-fetching from database
            const verifyRental = await Rental.findById(rental._id);
            console.log(`   Status verified in DB: ${verifyRental?.rentalStatus}`);

            if (verifyRental?.rentalStatus !== 'completed') {
                console.error(`❌ WARNING: Status not properly saved! Status is: ${verifyRental?.rentalStatus}`);
            }

            // Mark kayak as available again
            await Kayak.findByIdAndUpdate(rental.kayakId, { isAvailable: true });

            console.log(`Kayak ${rental.kayakId} returned and marked as available`);

            // Get user details for notifications
            const user = await User.findById(userId);
            if (user) {
                // Send notifications in the background - don't block the response on slow email/SMS providers
                emailService.sendReturnConfirmation(
                    user.email,
                    user.name || 'User',
                    kayak.name
                ).catch(err => console.error('Error sending return confirmation email:', err));

                if (user.phone) {
                    smsService.sendReturnConfirmation(
                        user.phone,
                        kayak.name
                    ).catch(err => console.error('Error sending return confirmation SMS:', err));
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
     * Unlock a kayak or storage box remotely via the gateway
     */
    
    public async remoteUnlock(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const { rentalId, lockId } = req.body;

        try {
            console.log('🔓 Remote unlock request for rental:', rentalId);

            // Find the rental
            const rental = await Rental.findById(rentalId).populate('kayakId');
            if (!rental) {
                console.log(`❌ Rental ${rentalId} not found`);
                res.status(404).json({ success: false, message: 'Rental not found' });
                return;
            }

            // Verify this rental belongs to the user
            if (rental.userId.toString() !== userId) {
                res.status(403).json({ success: false, message: 'Not authorized to unlock this kayak' });
                return;
            }

            // BLOCK UNLOCK IF KAYAK HAS BEEN RETURNED
            // If there's a return photo, the kayak has been returned
            if (rental.returnPhotoUrl) {
                console.log(`🚫 UNLOCK BLOCKED - Kayak already returned (return photo exists)`);
                res.status(400).json({ 
                    success: false, 
                    message: 'Cannot unlock - this kayak has already been returned.'
                });
                return;
            }

            console.log(`✅ Rental is still active - unlock permitted`);

            const kayak = rental.kayakId as any;
            const actualLockId = lockId || kayak?.lockId;

            if (!actualLockId) {
                console.error('❌ No lock ID found for kayak');
                res.status(400).json({ success: false, message: 'Kayak does not have a lock ID configured' });
                return;
            }

            console.log(`🔑 Lock ID: ${actualLockId}`);
            console.log(`🐐 Kayak name: ${kayak?.name}`);

            // Call TTLock to remotely unlock the lock
            const ttlockService = this.getTTLockService();
            const unlocked = await ttlockService.remoteUnlock(Number(actualLockId));

            if (unlocked) {
                console.log(`✅ Remote unlock successful for rental ${rentalId}!`);
                res.status(200).json({
                    success: true,
                    message: 'Kayak unlocked successfully!',
                    kayakName: kayak.name
                });
            } else {
                throw new Error('Remote unlock failed - gateway may be unreachable');
            }
        } catch (error) {
            console.error('❌ Error during remote unlock:', error);
            const errorMsg = safeError(error, 'Failed to unlock kayak remotely');
            res.status(500).json({ 
                success: false, 
                message: errorMsg,
                error: errorMsg 
            });
        }
    }

    /**
     * Get the current lock status (locked/unlocked) of a kayak
     */
    public async getLockStatus(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const { rentalId } = req.query;

        try {
            console.log('📊 Querying lock status for rental:', rentalId);

            if (!rentalId || typeof rentalId !== 'string') {
                res.status(400).json({ success: false, message: 'Rental ID is required' });
                return;
            }

            // Find the rental
            const rental = await Rental.findById(rentalId).populate('kayakId');
            if (!rental) {
                res.status(404).json({ success: false, message: 'Rental not found' });
                return;
            }

            // Verify this rental belongs to the user
            if (rental.userId.toString() !== userId) {
                res.status(403).json({ success: false, message: 'Not authorized to check this kayak status' });
                return;
            }

            const kayak = rental.kayakId as any;
            const lockIdToQuery = rental.kayakLockId; // Use the lock ID stored in the rental
            
            if (!lockIdToQuery) {
                res.status(400).json({ success: false, message: 'No lock ID assigned to this kayak' });
                return;
            }

            console.log(`🔑 Lock ID: ${lockIdToQuery}`);

            // Call TTLock to query lock state
            const ttlockService = this.getTTLockService();
            const state = await ttlockService.getLockState(Number(lockIdToQuery));

            // Update rental with latest status (kayak lock status for now)
            rental.kayakLockStatus = state;
            rental.kayakLockLastUpdate = new Date();
            await rental.save();

            const stateText = state === 0 ? 'locked' : state === 1 ? 'unlocked' : 'unknown';
            console.log(`✅ Lock status retrieved: ${stateText}`);

            res.status(200).json({
                success: true,
                lockStatus: state,
                statusText: stateText,
                kayakName: kayak.name,
                lastUpdated: rental.kayakLockLastUpdate
            });
        } catch (error) {
            console.error('Error querying lock status:', error);
            res.status(500).json({ 
                success: false, 
                message: safeError(error, 'Failed to query lock status'),
                error: safeError(error) 
            });
        }
    }

    /**
     * Get the battery level of a kayak's lock
     */
    public async getLockBattery(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const { rentalId } = req.query;

        try {
            console.log('🔋 Querying battery level for rental:', rentalId);

            if (!rentalId || typeof rentalId !== 'string') {
                res.status(400).json({ success: false, message: 'Rental ID is required' });
                return;
            }

            // Find the rental
            const rental = await Rental.findById(rentalId).populate('kayakId');
            if (!rental) {
                res.status(404).json({ success: false, message: 'Rental not found' });
                return;
            }

            // Verify this rental belongs to the user
            if (rental.userId.toString() !== userId) {
                res.status(403).json({ success: false, message: 'Not authorized to check this kayak battery' });
                return;
            }

            const kayak = rental.kayakId as any;
            console.log(`🔑 Lock ID: ${kayak.lockId}`);

            // Call TTLock to query battery level
            const ttlockService = this.getTTLockService();
            const battery = await ttlockService.getLockBattery(Number(kayak.lockId));

            console.log(`✅ Battery level retrieved: ${battery}%`);

            res.status(200).json({
                success: true,
                battery: battery,
                kayakName: kayak.name,
                batteryStatus: battery > 50 ? 'good' : battery > 20 ? 'fair' : 'low'
            });
        } catch (error) {
            console.error('Error querying battery level:', error);
            res.status(500).json({ 
                success: false, 
                message: safeError(error, 'Failed to query battery level'),
                error: safeError(error) 
            });
        }
    }

    /**
     * Diagnostic endpoint: Check lock and gateway status
     */
    public async diagnosticCheckLock(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const { rentalId } = req.query;

        try {
            console.log('🔍 Diagnostic lock check requested for rental:', rentalId);

            // Find the rental
            const rental = await Rental.findById(rentalId).populate('kayakId');
            if (!rental) {
                res.status(404).json({ success: false, message: 'Rental not found' });
                return;
            }

            // Verify this rental belongs to the user
            if (rental.userId.toString() !== userId) {
                res.status(403).json({ success: false, message: 'Not authorized to check this kayak' });
                return;
            }

            const kayak = rental.kayakId as any;
            const lockId = rental.kayakLockId || kayak?.lockId;

            if (!lockId) {
                res.status(400).json({ success: false, message: 'Kayak does not have a lock ID configured' });
                return;
            }

            // Call TTLock diagnostic
            const ttlockService = this.getTTLockService();
            const diagnostic = await ttlockService.diagnosticCheckLock(Number(lockId));

            res.status(200).json({
                success: true,
                diagnostic
            });
        } catch (error) {
            console.error('Error during diagnostic check:', error);
            res.status(500).json({ 
                success: false, 
                message: safeError(error, 'Failed to run diagnostic check'),
                error: safeError(error) 
            });
        }
    }
}

export default new RentalController();