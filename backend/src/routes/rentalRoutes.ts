import express from 'express';
import multer from 'multer';
import rentalController from '../controllers/rentalController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Protected routes - require authentication
router.get('/kayaks', authenticate, rentalController.getAvailableKayaks);
router.post('/rent', authenticate, rentalController.rentKayak);
router.get('/history', authenticate, rentalController.getRentalHistory);
router.post('/return', authenticate, upload.single('returnPhoto'), rentalController.returnKayak);
router.post('/update-pickup-photo', authenticate, rentalController.updatePickupPhoto);
router.post('/generate-passcode', authenticate, rentalController.generatePasscode);
router.post('/remote-unlock', authenticate, rentalController.remoteUnlock);

export default router;
