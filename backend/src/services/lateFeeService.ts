import Rental from '../models/rental';
import User from '../models/user';
import paymentService from './paymentService';
import emailService from './emailService';
import smsService from './smsService';

const GRACE_PERIOD_MINUTES = 15; // 15 minute buffer before charging
const LATE_FEE_PER_HOUR = 10; // $10 per hour

/**
 * Automatically charge customers for late kayak returns
 * Runs every 15 minutes to check active rentals past their end time
 */
export async function processLateReturnCharges() {
    try {
        console.log('⏰ Starting late return fee check...');

        // Find all active rentals (not yet returned)
        const activeRentals = await Rental.find({ rentalStatus: 'active' }).populate('userId').populate('kayakId');

        let totalCharges = 0;
        let chargesApplied = 0;

        for (const rental of activeRentals) {
            try {
                // Check if rental is past end time + grace period
                const rentalEndTime = new Date(rental.rentalEnd).getTime();
                const graceEndTime = rentalEndTime + (GRACE_PERIOD_MINUTES * 60 * 1000); // Add 15 minutes
                const now = new Date().getTime();

                if (now <= graceEndTime) {
                    // Still within grace period, skip
                    continue;
                }

                // Calculate total hours late (from rental end, not from grace end)
                const hoursLate = Math.ceil((now - rentalEndTime) / (1000 * 60 * 60));

                // Compare to what we've already charged
                const alreadyCharged = rental.totalLateChargesApplied || 0;
                const hoursSinceLastCharge = hoursLate - alreadyCharged;

                if (hoursSinceLastCharge < 1) {
                    // Not a full hour past what we've already charged
                    continue;
                }

                const user = rental.userId as any;
                const kayak = rental.kayakId as any;

                // Verify user has a Stripe customer ID (from their initial rental)
                if (!user.stripeCustomerId) {
                    console.warn(`⚠️ User ${user._id} has no Stripe customer ID, skipping late charge`);
                    continue;
                }

                // Charge for the new hour(s)
                const chargeAmount = Math.floor(hoursSinceLastCharge) * LATE_FEE_PER_HOUR;

                console.log(`💳 Charging late fee: Rental ${rental._id} - ${kayak.name}`);
                console.log(`   Total hours late: ${hoursLate} | Already charged: ${alreadyCharged} | New charge: ${Math.floor(hoursSinceLastCharge)} hours × $${LATE_FEE_PER_HOUR}`);

                // Process Stripe charge
                const paymentIntent = await paymentService.chargeCustomer(
                    user.stripeCustomerId,
                    chargeAmount,
                    `Late kayak return fee - ${Math.floor(hoursSinceLastCharge)} additional hour(s) at $${LATE_FEE_PER_HOUR}/hour`,
                    {
                        userId: user._id.toString(),
                        rentalId: rental._id.toString(),
                        hoursLate,
                        hoursSinceLastCharge: Math.floor(hoursSinceLastCharge)
                    }
                );

                // Update rental record
                rental.lastLateChargeTime = new Date();
                rental.totalLateChargesApplied = hoursLate;
                await rental.save();

                // Send notifications to user
                const timeUntilNextCharge = new Date(rentalEndTime + ((hoursLate + 1) * 60 * 60 * 1000));
                
                try {
                    await emailService.sendLateReturnNotification(
                        user.email,
                        user.name || user.username || 'User',
                        kayak.name,
                        chargeAmount,
                        hoursLate,
                        timeUntilNextCharge
                    );
                } catch (err) {
                    console.warn('Failed to send email notification:', err);
                }

                try {
                    if (user.phone) {
                        await smsService.sendLateReturnNotification(
                            user.phone,
                            kayak.name,
                            chargeAmount,
                            hoursLate
                        );
                    }
                } catch (err) {
                    console.warn('Failed to send SMS notification:', err);
                }

                totalCharges += chargeAmount;
                chargesApplied++;

                console.log(`✅ Late charge processed: $${chargeAmount} (Payment ID: ${paymentIntent.id})`);
            } catch (rentalError) {
                console.error(`❌ Error processing late charge for rental ${rental._id}:`, rentalError);
                // Continue to next rental, don't fail entire job
            }
        }

        console.log(`✅ Late return fee check complete: ${chargesApplied} charge(s) processed, $${totalCharges} total`);
        return { chargesApplied, totalCharges };
    } catch (error) {
        console.error('❌ Error in processLateReturnCharges:', error);
        throw error;
    }
}

/**
 * Get preview of what late fee would be charged for a rental
 */
export function calculateLateFeesPreview(rentalEndTime: Date): {
    isLate: boolean;
    hoursLate: number;
    withGracePeriod: boolean;
    nextChargeAt: Date;
    estimatedFee: number;
} {
    const rentalEnd = rentalEndTime.getTime();
    const graceEnd = rentalEnd + (GRACE_PERIOD_MINUTES * 60 * 1000);
    const now = new Date().getTime();

    const hoursLate = Math.ceil((now - rentalEnd) / (1000 * 60 * 60));
    const isLate = now > rentalEnd;
    const withGracePeriod = now > graceEnd;

    // Next charge would be at next full hour after grace period
    const nextChargeAt = new Date(graceEnd + (60 * 60 * 1000));

    return {
        isLate,
        hoursLate: Math.max(0, hoursLate),
        withGracePeriod,
        nextChargeAt,
        estimatedFee: Math.max(0, Math.floor(hoursLate) * LATE_FEE_PER_HOUR)
    };
}
