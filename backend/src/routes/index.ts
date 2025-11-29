import express from 'express';
import authRoutes from './authRoutes';
import waiverRoutes from './waiverRoutes';
import rentalRoutes from './rentalRoutes';
import paymentRoutes from './paymentRoutes';
import adminRoutes from './adminRoutes';
import passwordResetRoutes from './passwordResetRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/waiver', waiverRoutes);
router.use('/rental', rentalRoutes);
router.use('/payment', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/password-reset', passwordResetRoutes);

export default router;