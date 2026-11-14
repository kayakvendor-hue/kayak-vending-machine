import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import routes from './routes/index';
import dotenv from 'dotenv';
import { processLateReturnCharges } from './services/lateFeeService';
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Railway (and most PaaS) sit behind a reverse proxy - trust the first hop so
// req.ip / X-Forwarded-For are read correctly (required for rate limiting by IP).
app.set('trust proxy', 1);

// This API is intentionally called cross-origin from the Vercel frontend, so
// disable helmet's default same-origin resource policy (it would otherwise block
// the browser from reading responses even though CORS allows them).
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'https://kayak-vending-machine-cgsj.vercel.app',
    'https://kayak-vending-machine-git-main-james-paskerts-projects.vercel.app',
    'https://www.kayakvendor.com',
    'https://kayakvendor.com',
];

// Only trust Vercel preview/prod deployments that belong to this project,
// not any arbitrary *.vercel.app site (that would allow cross-site credentialed requests).
const isTrustedVercelPreview = (origin: string) =>
    /^https:\/\/kayak-vending-machine(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // Allow this project's Vercel deployments (preview + prod)
        if (isTrustedVercelPreview(origin)) {
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

// General safety-net rate limit across the whole API (specific routes have tighter limits)
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api', (req, res) => {
    res.json({ message: 'Kayak Vending Machine API is running', status: 'OK' });
});

app.use('/api', routes);

// Centralized error handler. Without this, errors thrown earlier in the chain
// (e.g. the CORS origin check rejecting an unrecognized Origin) fall through to
// Express's default handler, which responds with a raw 500 + stack trace instead
// of a clean, correctly-coded response - this broke preflight OPTIONS requests
// for disallowed origins with an opaque 500 instead of a proper 403.
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.message === 'Not allowed by CORS') {
        console.warn(`CORS rejected origin "${req.headers.origin}" for ${req.method} ${req.path}`);
        res.status(403).json({ message: 'Not allowed by CORS' });
        return;
    }

    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
    try {
        console.log('Attempting MongoDB connection...');
        await mongoose.connect(process.env.DATABASE_URL as string, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
        });

        console.log('Database connected successfully');

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