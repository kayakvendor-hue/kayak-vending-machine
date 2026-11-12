import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TTLockService } from '../services/ttlockService';
import Kayak from '../models/kayak';
import { safeError } from '../utils/errorResponse';

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
            
            // Gateway status comes from TTLock's gateway flag (same rule as the rental gate)
            const ttlockService = this.getTTLockService();
            const locks = await ttlockService.getLocksForGateway(gatewayId);
            const online = await ttlockService.isGatewayOnline(gatewayId);

            const mostRecentUpdate = locks.length > 0
                ? Math.max(...locks.map((lock: any) => lock.updateDate || 0))
                : 0;
            const lastHeartbeat = new Date(mostRecentUpdate);
            const gatewayStatus = online ? 'online' : 'offline';

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
                error: safeError(error)
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
            const gatewayId = 2245851; // Kayak G4 gateway ID from TTLock

            const isOnline = await ttlockService.isGatewayOnline(gatewayId);

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
                error: safeError(error)
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
                error: safeError(error)
            });
        }
    }
}

export default new GatewayController();
