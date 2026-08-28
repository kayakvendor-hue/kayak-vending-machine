import express from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { signupLimiter, loginLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.post('/signup', signupLimiter, authController.signup);
router.post('/login', loginLimiter, authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

export default router;
