import { Router } from 'express';
import passwordResetController from '../controllers/passwordResetController';

const router = Router();

// Request password reset (sends email)
router.post('/request', passwordResetController.requestReset);

// Verify reset token
router.get('/verify/:token', passwordResetController.verifyResetToken);

// Reset password with token
router.post('/reset/:token', passwordResetController.resetPassword);

export default router;
