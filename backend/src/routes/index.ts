import express from 'express';
import authRoutes from './authRoutes';
import waiverRoutes from './waiverRoutes';
import rentalRoutes from './rentalRoutes';
import paymentRoutes from './paymentRoutes';
import adminRoutes from './adminRoutes';
import passwordResetRoutes from './passwordResetRoutes';
import gatewayRoutes from './gatewayRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/waiver', waiverRoutes);
router.use('/rental', rentalRoutes);
router.use('/payment', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/password-reset', passwordResetRoutes);
router.use('/gateway', gatewayRoutes);

export default router;