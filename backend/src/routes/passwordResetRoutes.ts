import { Router } from 'express';
import passwordResetController from '../controllers/passwordResetController';
import { forgotPasswordLimiter, resetPasswordLimiter } from '../middleware/rateLimiter';

const router = Router();

// Request password reset (sends email)
router.post('/request', forgotPasswordLimiter, passwordResetController.requestReset);

// Verify reset token
router.get('/verify/:token', passwordResetController.verifyResetToken);

// Reset password with token
router.post('/reset/:token', resetPasswordLimiter, passwordResetController.resetPassword);

export default router;
