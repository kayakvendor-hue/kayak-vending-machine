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

mongoose.connect(process.env.DATABASE_URL as string, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Database connected successfully');
})
.catch(err => {
    console.error('Database connection error:', err);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});