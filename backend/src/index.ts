import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes/index';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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