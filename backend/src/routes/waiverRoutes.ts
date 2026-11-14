import express from 'express';
import waiverController from '../controllers/waiverController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Protected routes - require authentication
router.post('/sign', authenticate, waiverController.signWaiver);
router.get('/status', authenticate, waiverController.getWaiverStatus);

export default router;
