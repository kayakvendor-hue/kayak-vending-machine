import express from 'express';
import rentalController from '../controllers/rentalController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Protected routes - require authentication
router.get('/kayaks', authenticate, rentalController.getAvailableKayaks);
router.post('/rent', authenticate, rentalController.rentKayak);
router.get('/history', authenticate, rentalController.getRentalHistory);
router.post('/return', authenticate, rentalController.returnKayak);
router.post('/update-pickup-photo', authenticate, rentalController.updatePickupPhoto);

export default router;
