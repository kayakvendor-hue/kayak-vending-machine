import express from 'express';
import paymentController from '../controllers/paymentController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Create payment intent for rental
router.post('/create-intent', authenticate, paymentController.createPaymentIntent);

// Get payment status
router.get('/status/:paymentIntentId', authenticate, paymentController.getPaymentStatus);

// Save payment method to user profile
router.post('/save-payment-method', authenticate, paymentController.savePaymentMethod);

// Charge for damages (admin only)
router.post('/charge-damage', authenticate, requireAdmin, paymentController.chargeDamage);

export default router;
