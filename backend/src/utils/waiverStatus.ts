import Waiver from '../models/waiver';
import User from '../models/user';
import { isAtLeastMinimumRentalAge } from './validators';

export type WaiverState = {
    signed: boolean;
    signedAt: Date | null;
    expiresAt: Date | null;
    isExpired: boolean;
    dateOfBirth: Date | null;
    isAdult: boolean;
};

// The one-time signature + date-of-birth capture never expires on its own.
// Instead, the renter is asked to re-confirm the waiver (via checkbox, no
// signature required) before every subsequent rental - see rentalController.
export async function getUserWaiverState(userId: string): Promise<WaiverState> {
    // First check if user has waiverSigned flag set to true
    const user = await User.findById(userId).select('waiverSigned');
    
    // If user explicitly has waiverSigned = false, return not signed
    if (user && user.waiverSigned === false) {
        return {
            signed: false,
            signedAt: null,
            expiresAt: null,
            isExpired: true,
            dateOfBirth: null,
            isAdult: false,
        };
    }

    // Now check the Waiver collection for the one-time master signature record
    const latestWaiver = await Waiver.findOne({ userId }).sort({ dateSigned: -1 });

    if (!latestWaiver) {
        return {
            signed: false,
            signedAt: null,
            expiresAt: null,
            isExpired: true,
            dateOfBirth: null,
            isAdult: false,
        };
    }

    return {
        signed: true,
        signedAt: latestWaiver.dateSigned || null,
        expiresAt: null,
        isExpired: false,
        dateOfBirth: latestWaiver.dateOfBirth || null,
        // Re-derived from DOB on every check (not just at sign time) so it
        // stays accurate even for older waiver records.
        isAdult: latestWaiver.dateOfBirth ? isAtLeastMinimumRentalAge(latestWaiver.dateOfBirth) : false,
    };
}

