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
    private healthCheckInterval: NodeJS.Timeout | null = null;
    // null = not yet checked since startup; the first check always syncs kayak flags
    private isGatewayOnline: boolean | null = null;
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
     * Gateway health check using the same online rule as the admin button and rental gate
     * (TTLockService.isGatewayOnline). Kayaks are marked unavailable when the gateway goes
     * offline and available again when it comes back.
     */
    public async checkGatewayHealth(): Promise<boolean> {
        try {
            this.lastCheckTime = new Date();
            const ttlockService = this.getTTLockService();

            const online = await ttlockService.isGatewayOnline(this.GATEWAY_ID);

            if (online) {
                const wasOnline = this.isGatewayOnline;
                this.isGatewayOnline = true;
                if (wasOnline !== true) {
                    console.log('🟢 GATEWAY ONLINE');
                    await this.updateAllKayaksOnline();
                }
                return true;
            }

            const wasOnline = this.isGatewayOnline;
            this.isGatewayOnline = false;
            if (wasOnline !== false) {
                console.log('🔴 GATEWAY OFFLINE');
                await this.updateAllKayaksOffline();
            }
            return false;
        } catch (error: any) {
            console.error('❌ Unexpected error in health check:', error.message);
            const wasOnline = this.isGatewayOnline;
            this.isGatewayOnline = false;

            if (wasOnline !== false) {
                await this.updateAllKayaksOffline();
            }

            return false;
        }
    }

    /**
     * Get current gateway health status
     */
    public getHealthStatus(): {
        isOnline: boolean | null;
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
