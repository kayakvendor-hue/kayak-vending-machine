import express from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

export default router;
