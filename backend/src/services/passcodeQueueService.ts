import PasscodeQueue, { IPasscodeQueue } from '../models/passcodeQueue';
import { TTLockService } from './ttlockService';

export class PasscodeQueueService {
    private ttlockService: TTLockService;
    private queueSize = 5; // Keep 5 passcodes queued per lock
    private passcodeValidityHours = 24; // How long each passcode is valid

    constructor(ttlockService: TTLockService) {
        this.ttlockService = ttlockService;
    }

    /**
     * Get the next available passcode from queue without consuming it yet
     * Used for displaying to user
     */
    async getNextPasscodePreview(lockId: number): Promise<{ code: string; passcodeId: number } | null> {
        const queue = await PasscodeQueue.findOne({ lockId });
        if (!queue || queue.passcodes.length === 0) {
            return null;
        }
        const next = queue.passcodes[0];
        return { code: next.code, passcodeId: next.passcodeId };
    }

    /**
     * Pull and consume the next passcode from queue
     * This REMOVES it from the queue and refills if needed
     */
    async consumeNextPasscode(lockId: number): Promise<{ code: string; passcodeId: number } | null> {
        const queue = await PasscodeQueue.findOne({ lockId });
        if (!queue || queue.passcodes.length === 0) {
            console.warn(`⚠️ No passcodes in queue for lock ${lockId}. Generating fallback...`);
            return await this.generateFallbackPasscode(lockId);
        }

        // Remove first passcode from queue
        const consumed = queue.passcodes.shift()!;
        await queue.save();

        console.log(`✅ Consumed passcode from queue for lock ${lockId} (${queue.passcodes.length} remaining)`);

        // Refill queue if running low
        if (queue.passcodes.length < this.queueSize / 2) {
            console.log(`📊 Queue below threshold, triggering refill for lock ${lockId}`);
            this.refillQueueAsync(lockId).catch((error) =>
                console.error(`❌ Error refilling queue for lock ${lockId}:`, error)
            );
        }

        return { code: consumed.code, passcodeId: consumed.passcodeId };
    }

    /**
     * Refill the queue with new passcodes (async in background)
     */
    async refillQueueAsync(lockId: number): Promise<void> {
        try {
            let queue = await PasscodeQueue.findOne({ lockId });
            if (!queue) {
                console.warn(`⚠️ Queue not found for lock ${lockId}`);
                return;
            }

            const needed = this.queueSize - queue.passcodes.length;
            if (needed <= 0) {
                console.log(`✅ Queue full for lock ${lockId}`);
                return;
            }

            console.log(`🔄 Refilling queue for lock ${lockId}: generating ${needed} passcodes...`);

            for (let i = 0; i < needed; i++) {
                try {
                    const now = Date.now();
                    const startDate = now;
                    const endDate = now + this.passcodeValidityHours * 60 * 60 * 1000; // 24 hours from now

                    const result = await this.ttlockService.generatePasscode(lockId, startDate, endDate);

                    queue.passcodes.push({
                        code: result.passcode,
                        passcodeId: result.passcodeId,
                        generatedAt: new Date(),
                        startDate,
                        endDate
                    });

                    console.log(`   ✅ Generated passcode ${i + 1}/${needed}: ${result.passcode}`);
                } catch (error) {
                    console.error(`   ❌ Failed to generate passcode ${i + 1}/${needed}:`, error);
                }
            }

            queue.lastGenerated = new Date();
            await queue.save();
            console.log(`✅ Queue refill complete for lock ${lockId} (now has ${queue.passcodes.length} passcodes)`);
        } catch (error) {
            console.error(`❌ Fatal error refilling queue for lock ${lockId}:`, error);
        }
    }

    /**
     * Initialize queue for a lock (one-time setup)
     */
    async initializeQueue(lockId: number, designation: string): Promise<IPasscodeQueue> {
        let queue = await PasscodeQueue.findOne({ lockId });
        if (queue) {
            console.log(`✅ Queue already exists for lock ${lockId}`);
            return queue;
        }

        console.log(`🆕 Creating new queue for lock ${lockId} (${designation})`);
        queue = new PasscodeQueue({
            lockId,
            designation,
            passcodes: []
        });
        await queue.save();

        // Generate initial batch of passcodes
        await this.refillQueueAsync(lockId);

        return queue;
    }

    /**
     * Generate a random passcode when queue is empty (fallback)
     */
    private async generateFallbackPasscode(lockId: number): Promise<{ code: string; passcodeId: number }> {
        console.warn(`⚠️ Using fallback passcode for lock ${lockId} (queue unavailable)`);
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        return { code, passcodeId: 0 };
    }

    /**
     * Delete all expired passcodes from queue
     * Call periodically to clean up
     */
    async cleanupExpiredPasscodes(): Promise<void> {
        const now = Date.now();
        const result = await PasscodeQueue.updateMany(
            {},
            {
                $pull: {
                    passcodes: { endDate: { $lt: now } }
                }
            }
        );
        console.log(`🧹 Cleaned up expired passcodes: ${result.modifiedCount} queues updated`);
    }

    /**
     * Get queue status for debugging
     */
    async getQueueStatus(lockId: number): Promise<any> {
        const queue = await PasscodeQueue.findOne({ lockId });
        if (!queue) {
            return { lockId, status: 'not_found' };
        }
        return {
            lockId,
            designation: queue.designation,
            queueSize: queue.passcodes.length,
            nextPasscode: queue.passcodes[0]?.code || 'NONE',
            lastGenerated: queue.lastGenerated,
            passcodes: queue.passcodes.map((p) => ({
                code: p.code,
                expiresAt: new Date(p.endDate).toLocaleString()
            }))
        };
    }
}
