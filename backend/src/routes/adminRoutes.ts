import express from 'express';
import adminController from '../controllers/adminController';
import rentalController from '../controllers/rentalController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// All admin routes require authentication AND admin status
router.get('/rentals', authenticate, requireAdmin, adminController.getAllRentals);
router.get('/rentals/active', authenticate, requireAdmin, adminController.getActiveRentals);
router.get('/stats', authenticate, requireAdmin, adminController.getStats);
router.get('/users', authenticate, requireAdmin, adminController.getAllUsers);
router.get('/users/:userId/waiver', authenticate, requireAdmin, adminController.getUserWaiver);
router.put('/kayak/availability', authenticate, requireAdmin, adminController.updateKayakAvailability);
router.get('/kayaks', authenticate, requireAdmin, adminController.getAllKayaks);
router.put('/kayak/details', authenticate, requireAdmin, adminController.updateKayakDetails);
router.post('/return/kayak', authenticate, requireAdmin, rentalController.returnKayak);
router.get('/rentals/:rentalId/waiver.pdf', authenticate, requireAdmin, adminController.getRentalWaiverPdf);
router.get('/rentals/:rentalId/riders/:index/waiver.pdf', authenticate, requireAdmin, adminController.getRiderWaiverPdf);

export default router;
