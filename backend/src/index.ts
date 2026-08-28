import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';
import routes from './routes/index';
import dotenv from 'dotenv';
import { processLateReturnCharges } from './services/lateFeeService';
import Lock from './models/lock';
import TTLockService from './services/ttlockService';
import { PasscodeQueueService } from './services/passcodeQueueService';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'https://kayak-vending-machine-cgsj.vercel.app',
    'https://kayak-vending-machine-git-main-james-paskerts-projects.vercel.app',
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // Allow all vercel.app deployments
        if (origin.includes('.vercel.app')) {
            return callback(null, true);
        }
        
        // Allow configured origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Development: Allow all local network IPs (192.168.x.x, 10.x.x.x)
        if (process.env.NODE_ENV !== 'production') {
            if (origin && (origin.includes('192.168.') || origin.includes('10.') || origin.includes('localhost'))) {
                return callback(null, true);
            }
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/api', (req, res) => {
    res.json({ message: 'Kayak Vending Machine API is running', status: 'OK' });
});

app.use('/api', routes);

async function startServer() {
    try {
        console.log('Attempting MongoDB connection...');
        await mongoose.connect(process.env.DATABASE_URL as string, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
        });

        console.log('Database connected successfully');

        // Initialize passcode queues for all existing locks
        console.log('🔄 Initializing passcode queues for all locks...');
        try {
            const ttlockService = new TTLockService(
                process.env.TTLOCK_API_URL || 'https://euapi.ttlock.com',
                process.env.TTLOCK_CLIENT_ID as string,
                process.env.TTLOCK_CLIENT_SECRET as string
            );
            const queueService = new PasscodeQueueService(ttlockService);
            
            const locks = await Lock.find({});
            for (const lock of locks) {
                if (lock.lockId && lock.status === 'available') {
                    try {
                        await queueService.initializeQueue(lock.lockId, lock.designation);
                    } catch (error) {
                        console.warn(`⚠️ Failed to initialize queue for lock ${lock.lockId}:`, error);
                    }
                }
            }
            console.log(`✅ Passcode queue initialization complete (${locks.length} locks processed)`);
        } catch (error) {
            console.error(`❌ Error initializing queues:`, error);
            // Don't fail startup if queue init fails
        }

        // Start scheduled job for late return charges every 15 minutes
        console.log('📅 Starting late return fee scheduler...');
        cron.schedule('*/15 * * * *', async () => {
            console.log('⏰ Late fee check triggered at:', new Date().toLocaleTimeString());
            try {
                await processLateReturnCharges();
            } catch (error) {
                console.error('❌ Error in late fee check:', error);
            }
        });
        console.log('✅ Late return fee scheduler started (runs every 15 minutes)');

        // Start scheduled job to cleanup expired passcodes daily
        console.log('📅 Starting passcode queue cleanup...');
        cron.schedule('0 2 * * *', async () => {
            console.log('🧹 Passcode queue cleanup triggered at:', new Date().toLocaleTimeString());
            try {
                const ttlockService = new TTLockService(
                    process.env.TTLOCK_API_URL || 'https://euapi.ttlock.com',
                    process.env.TTLOCK_CLIENT_ID as string,
                    process.env.TTLOCK_CLIENT_SECRET as string
                );
                const queueService = new PasscodeQueueService(ttlockService);
                await queueService.cleanupExpiredPasscodes();
            } catch (error) {
                console.error('❌ Error in passcode cleanup:', error);
            }
        });
        console.log('✅ Passcode cleanup scheduler started (runs daily at 2 AM)');

        // Health checks now happen on-demand when user clicks "Continue to Payment"
        // See: POST /api/rentals/pre-payment-check

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
            console.log(`📱 Access from phone at: http://YOUR_PC_IP:${PORT}`);
        });
    } catch (err: any) {
        console.error('Database connection error:');
        console.error(err);
        process.exit(1);
    }
}

startServer();