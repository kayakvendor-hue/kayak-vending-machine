import express from 'express';
import gatewayController from '../controllers/gatewayController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Gateway endpoints - admin only
router.get('/status', authenticate, requireAdmin, gatewayController.getGatewayStatus);
router.get('/online-check', authenticate, requireAdmin, gatewayController.checkGatewayOnline);
router.get('/kayak-status', authenticate, requireAdmin, gatewayController.getKayakLockStatus);
router.get('/:gatewayId', authenticate, requireAdmin, gatewayController.getGatewayDetails);

export default router;
