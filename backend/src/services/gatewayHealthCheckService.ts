import TTLockService from './ttlockService';
import Kayak from '../models/kayak';

/**
 * Gateway Health Check Service
 * Periodically tests actual gateway connectivity by querying lock state
 * More reliable than cache-age based detection
 */
class GatewayHealthCheckService {
    private ttlockService: TTLockService | null = null;
    private GATEWAY_ID = 2245851; // Kayak gateway
    private TEST_LOCK_ID = 18499305; // Kayak #2 (most reliable lock)
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private isGatewayOnline = true;
    private lastCheckTime = new Date();

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
     * Start periodic health checks (every 20 seconds)
     */
    public startHealthCheck(): void {
        console.log('🏥 Starting gateway health check service...');
        
        // Run immediately on startup
        this.checkGatewayHealth().catch((error) => {
            console.error('❌ Initial health check failed:', error.message);
        });

        // Then run every 20 seconds
        this.healthCheckInterval = setInterval(() => {
            this.checkGatewayHealth().catch((error) => {
                console.error('❌ Health check failed:', error.message);
            });
        }, 20000); // 20 seconds
    }

    /**
     * Stop health checks
     */
    public stopHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            console.log('🛑 Gateway health check service stopped');
        }
    }

    /**
     * Direct gateway health check by querying lock state
     * This actually communicates with the gateway
     * Retries 3 times - only marks offline if ALL 3 attempts fail
     */
    public async checkGatewayHealth(): Promise<boolean> {
        try {
            this.lastCheckTime = new Date();
            const ttlockService = this.getTTLockService();

            const MAX_ATTEMPTS = 3;
            let lastError: any = null;

            // Try up to 3 times
            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                try {
                    console.log(`🔍 Health check attempt ${attempt}/${MAX_ATTEMPTS}: Querying lock ${this.TEST_LOCK_ID} state...`);
                    
                    const lockState = await ttlockService.getLockState(this.TEST_LOCK_ID);
                    
                    // Success on this attempt
                    const wasOffline = !this.isGatewayOnline;
                    this.isGatewayOnline = true;
                    
                    if (wasOffline) {
                        console.log(`🟢 GATEWAY ONLINE - Lock state query succeeded on attempt ${attempt} (state: ${lockState === 0 ? 'locked' : 'unlocked'})`);
                        await this.updateAllKayaksOnline();
                    } else {
                        console.log(`✅ Gateway online (attempt ${attempt}, lock state: ${lockState === 0 ? 'locked' : 'unlocked'})`);
                    }
                    
                    return true;
                } catch (error: any) {
                    lastError = error;
                    if (attempt < MAX_ATTEMPTS) {
                        console.log(`   ⚠️  Attempt ${attempt} failed: ${error.message} - retrying...`);
                    } else {
                        console.log(`   ❌ Attempt ${attempt} failed: ${error.message}`);
                    }
                    // Continue to next attempt
                }
            }

            // All 3 attempts failed
            const wasOnline = this.isGatewayOnline;
            this.isGatewayOnline = false;
            
            if (wasOnline) {
                console.log(`🔴 GATEWAY OFFLINE - All 3 lock state queries failed: ${lastError?.message}`);
                await this.updateAllKayaksOffline();
            } else {
                console.log(`⚠️  Gateway still offline (all 3 attempts failed)`);
            }
            
            return false;
        } catch (error: any) {
            console.error('❌ Unexpected error in health check:', error.message);
            const wasOnline = this.isGatewayOnline;
            this.isGatewayOnline = false;
            
            if (wasOnline) {
                await this.updateAllKayaksOffline();
            }
            
            return false;
        }
    }

    /**
     * Get current gateway health status
     */
    public getHealthStatus(): {
        isOnline: boolean;
        lastCheckTime: Date;
        timeSinceLastCheck: number;
    } {
        const timeSinceLastCheck = Date.now() - this.lastCheckTime.getTime();
        return {
            isOnline: this.isGatewayOnline,
            lastCheckTime: this.lastCheckTime,
            timeSinceLastCheck
        };
    }

    /**
     * Mark all kayaks as online (gateway is responding)
     */
    private async updateAllKayaksOnline(): Promise<void> {
        try {
            const updated = await Kayak.updateMany(
                { lockOnline: false },
                {
                    lockOnline: true,
                    lockStatusReason: 'online',
                    lastLockStatusCheck: new Date()
                }
            );
            if (updated.modifiedCount > 0) {
                console.log(`🟢 Gateway back online - marked ${updated.modifiedCount} kayak(s) as AVAILABLE`);
            }
        } catch (error) {
            console.error('❌ Failed to update kayaks to online:', error);
        }
    }

    /**
     * Mark all kayaks as offline (gateway not responding)
     */
    private async updateAllKayaksOffline(): Promise<void> {
        try {
            const updated = await Kayak.updateMany(
                { lockOnline: true },
                {
                    lockOnline: false,
                    lockStatusReason: 'gateway-offline',
                    lastLockStatusCheck: new Date()
                }
            );
            if (updated.modifiedCount > 0) {
                console.log(`🔴 Gateway offline - marked ${updated.modifiedCount} kayak(s) as UNAVAILABLE`);
            }
        } catch (error) {
            console.error('❌ Failed to update kayaks to offline:', error);
        }
    }
}

export default new GatewayHealthCheckService();
