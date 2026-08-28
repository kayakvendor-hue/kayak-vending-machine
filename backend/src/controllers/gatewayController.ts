import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TTLockService } from '../services/ttlockService';
import Kayak from '../models/kayak';

class GatewayController {
    private ttlockService: TTLockService | null = null;

    constructor() {
        this.getGatewayStatus = this.getGatewayStatus.bind(this);
        this.getGatewayDetails = this.getGatewayDetails.bind(this);
        this.getKayakLockStatus = this.getKayakLockStatus.bind(this);
        this.checkGatewayOnline = this.checkGatewayOnline.bind(this);
    }

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
     * Get gateway status - for admin dashboard
     */
    public async getGatewayStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Hardcoded gateway ID for now - can be made dynamic later
            const gatewayId = 2245851; // Kayak G4 gateway ID from TTLock
            
            // Get locks connected to this gateway
            const ttlockService = this.getTTLockService();
            const locks = await ttlockService.getLocksForGateway(gatewayId);

            // Determine gateway status based on lock update timestamps
            // If gateway is online, it should be reporting lock status updates frequently
            let gatewayStatus = 'offline';
            let lastHeartbeat = new Date(0); // Very old date
            
            if (locks.length > 0) {
                // Find the most recent updateDate from all locks
                const mostRecentUpdate = Math.max(
                    ...locks.map((lock: any) => lock.updateDate || 0)
                );
                lastHeartbeat = new Date(mostRecentUpdate);
                
                // If most recent update is within the last 5 minutes, gateway is online
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                gatewayStatus = mostRecentUpdate > fiveMinutesAgo ? 'online' : 'offline';
                
                console.log(`🌐 Gateway ${gatewayId} last heartbeat: ${lastHeartbeat.toISOString()}`);
                console.log(`   Status: ${gatewayStatus}`);
            } else {
                console.log(`⚠️  Gateway ${gatewayId} has no locks - cannot determine status`);
                gatewayStatus = 'unknown';
            }

            const gateway = {
                deviceId: gatewayId,
                gatewayName: 'Kayak',
                status: gatewayStatus,
                batteryLevel: undefined,
                lastHeartbeat: lastHeartbeat,
                connectionType: 'WiFi',
                firmwareVersion: 'N/A',
                locksConnected: locks.length
            };

            res.status(200).json({
                success: true,
                gateway,
                locks: locks.map((lock: any) => ({
                    lockId: lock.lockId,
                    lockName: lock.lockName,
                    rssi: lock.rssi,
                    lastUpdate: new Date(lock.updateDate)
                }))
            });
        } catch (error: any) {
            console.error('❌ Failed to get gateway status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch gateway status',
                error: error.message
            });
        }
    }

    /**
     * Quick health check - test if gateway is online with 3 retry attempts
     * Used by admin dashboard to check live gateway status
     */
    public async checkGatewayOnline(req: AuthRequest, res: Response): Promise<void> {
        try {
            const ttlockService = this.getTTLockService();
            const testLockId = 18499305; // Kayak #2 - most reliable signal (-63 STRONG RSSI)
            
            // Try 3 times to query lock state
            let isOnline = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`🔍 Gateway online check - attempt ${attempt}/3...`);
                    const lockState = await ttlockService.getLockState(testLockId);
                    // If we got a response, gateway is online
                    isOnline = true;
                    console.log(`✅ Gateway online check passed on attempt ${attempt}`);
                    break;
                } catch (err) {
                    console.log(`⚠️ Gateway online check attempt ${attempt} failed, retrying...`);
                    if (attempt === 3) {
                        // All 3 attempts failed
                        console.log('❌ Gateway online check failed after 3 attempts');
                    }
                    // Continue to next attempt
                }
            }

            res.status(200).json({
                success: true,
                online: isOnline,
                status: isOnline ? 'online' : 'offline',
                message: isOnline ? 'Gateway is responding' : 'Gateway is not responding'
            });
        } catch (error: any) {
            console.error('❌ Failed to check gateway online status:', error);
            res.status(200).json({
                success: true,
                online: false,
                status: 'offline',
                message: 'Gateway is not responding'
            });
        }
    }

    /**
     * Get detailed gateway information
     */
    public async getGatewayDetails(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { gatewayId } = req.params;
            
            if (!gatewayId) {
                res.status(400).json({ success: false, message: 'Gateway ID required' });
                return;
            }

            // Get locks for this gateway
            const ttlockService = this.getTTLockService();
            const locks = await ttlockService.getLocksForGateway(parseInt(gatewayId));

            res.status(200).json({
                success: true,
                gateway: {
                    deviceId: gatewayId,
                    status: 'online'
                },
                locks
            });
        } catch (error: any) {
            console.error('❌ Failed to get gateway details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch gateway details',
                error: error.message
            });
        }
    }

    /**
     * Get all kayaks with their lock status
     */
    public async getKayakLockStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const kayaks = await Kayak.find({}).sort({ createdAt: 1 });

            const kayakStatus = kayaks.map((kayak: any) => ({
                id: kayak._id,
                name: kayak.name,
                location: kayak.location,
                isAvailable: kayak.isAvailable,
                lockOnline: kayak.lockOnline,
                lockStatusReason: kayak.lockStatusReason,
                lastLockStatusCheck: kayak.lastLockStatusCheck,
                status: kayak.isAvailable && kayak.lockOnline ? 'Available' : 'Unavailable',
                reason: !kayak.lockOnline ? `Lock ${kayak.lockStatusReason}` : 'OK'
            }));

            res.status(200).json({
                success: true,
                kayaks: kayakStatus,
                availableCount: kayakStatus.filter((k: any) => k.status === 'Available').length,
                unavailableCount: kayakStatus.filter((k: any) => k.status === 'Unavailable').length
            });
        } catch (error: any) {
            console.error('❌ Failed to get kayak lock status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch kayak status',
                error: error.message
            });
        }
    }
}

export default new GatewayController();
