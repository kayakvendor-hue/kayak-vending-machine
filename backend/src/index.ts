import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes/index';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err: any) {
        console.error('Database connection error:');
        console.error(err);
        process.exit(1);
    }
}

startServer();