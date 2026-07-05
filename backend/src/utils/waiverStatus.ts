import Waiver from '../models/waiver';

export const WAIVER_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

export type WaiverState = {
    signed: boolean;
    signedAt: Date | null;
    expiresAt: Date | null;
    isExpired: boolean;
};

export async function getUserWaiverState(userId: string): Promise<WaiverState> {
    const latestWaiver = await Waiver.findOne({ userId }).sort({ dateSigned: -1 });

    if (!latestWaiver) {
        return {
            signed: false,
            signedAt: null,
            expiresAt: null,
            isExpired: true,
        };
    }

    const signedAt = latestWaiver.dateSigned || null;
    const expiresAt = signedAt ? new Date(signedAt.getTime() + WAIVER_VALIDITY_MS) : null;
    const isExpired = !expiresAt || expiresAt.getTime() <= Date.now();

    return {
        signed: !isExpired,
        signedAt,
        expiresAt,
        isExpired,
    };
}