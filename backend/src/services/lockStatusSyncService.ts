import TTLockService from './ttlockService';
import Lock from '../models/lock';
import Kayak from '../models/kayak';

/**
 * Service to sync TTLock gateway/lock status with Kayak availability
 * Periodically checks if locks are online and updates kayak availability
 */
class LockStatusSyncService {
    private ttlockService: TTLockService | null = null;
    private GATEWAY_ID = 2245851; // Kayak gateway
    private syncInterval: NodeJS.Timeout | null = null;

    private getTTLockService(): TTLockService {
        if (!this.ttlockService) {
            this.ttlockService = new TTLockService(
                process.env.TTLOCK_API_URL || 'https://euapi.ttlock.com',
                process.env.TTLOCK_CLIENT_ID as string,
                process.env.TTLOCK_CLIENT_SECRET as string
            );
        }
        return this.ttlockService;
    }

    /**
     * Start the periodic sync job (runs every 30 seconds)
     */
    public startSync(): void {
        console.log('🔄 Starting lock status sync service...');
        
        // Run immediately on startup
        this.syncLockStatuses().catch((error) => {
            console.error('❌ Initial lock sync failed:', error.message);
        });

        // Then run every 30 seconds
        this.syncInterval = setInterval(() => {
            this.syncLockStatuses().catch((error) => {
                console.error('❌ Lock sync failed:', error.message);
            });
        }, 30000); // 30 seconds
    }

    /**
     * Stop the periodic sync job
     */
    public stopSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('🛑 Lock status sync service stopped');
        }
    }

    /**
     * Sync lock statuses from TTLock gateway with local kayak availability
     */
    public async syncLockStatuses(): Promise<void> {
        try {
            const ttlockService = this.getTTLockService();

            // Get all locks from gateway
            let gatewayLocks: any[] = [];
            let gatewayOnline = true;
            
            try {
                gatewayLocks = await ttlockService.getLocksForGateway(this.GATEWAY_ID);
            } catch (error: any) {
                console.log('⚠️  Gateway query failed - treating gateway as offline');
                gatewayOnline = false;
            }

            // Determine gateway status based on lock update timestamps
            if (gatewayOnline && gatewayLocks.length > 0) {
                const mostRecentUpdate = Math.max(
                    ...gatewayLocks.map((lock: any) => lock.updateDate || 0)
                );
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                gatewayOnline = mostRecentUpdate > fiveMinutesAgo;
            } else if (gatewayOnline && gatewayLocks.length === 0) {
                gatewayOnline = false; // No locks means gateway not responding
            }

            console.log(`📡 Gateway status: ${gatewayOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
            console.log(`🔒 Found ${gatewayLocks.length} locks connected to gateway`);

            // If gateway is offline, mark all kayaks as unavailable
            if (!gatewayOnline) {
                const updated = await Kayak.updateMany(
                    { lockOnline: true },
                    { 
                        lockOnline: false,
                        lastLockStatusCheck: new Date(),
                        lockStatusReason: 'gateway-offline'
                    }
                );
                if (updated.modifiedCount > 0) {
                    console.log(`⚠️  Marked ${updated.modifiedCount} kayaks as UNAVAILABLE (gateway offline)`);
                }
                return;
            }

            // Gateway is online, update individual kayak statuses based on lock signal
            const allKayaks = await Kayak.find({});

            for (const kayak of allKayaks) {
                if (!kayak.lockDesignation) {
                    continue;
                }

                // Find the lock for this kayak
                const lock = await Lock.findOne({ designation: kayak.lockDesignation });
                if (!lock) {
                    console.log(`⚠️  No lock found for kayak ${kayak.name}`);
                    continue;
                }

                // Find lock status in gateway list
                const gatewayLock = gatewayLocks.find(
                    (gl: any) => gl.lockId === lock.lockId
                );

                if (!gatewayLock) {
                    // Lock not found in gateway list = no signal
                    const wasOnline = kayak.lockOnline;
                    kayak.lockOnline = false;
                    kayak.lockStatusReason = 'no-signal';
                    kayak.lastLockStatusCheck = new Date();
                    await kayak.save();
                    
                    if (wasOnline) {
                        console.log(`🔴 ${kayak.name} - LOST SIGNAL (unavailable)`);
                    }
                } else {
                    // Lock found in gateway list = has signal
                    const wasOffline = !kayak.lockOnline;
                    kayak.lockOnline = true;
                    kayak.lockStatusReason = 'online';
                    kayak.lastLockStatusCheck = new Date();
                    await kayak.save();

                    if (wasOffline) {
                        console.log(`🟢 ${kayak.name} - SIGNAL RESTORED (available)`);
                    }
                }
            }
        } catch (error: any) {
            console.error('❌ Lock status sync error:', error.message);
        }
    }
}

export default new LockStatusSyncService();
