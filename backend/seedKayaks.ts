import mongoose from 'mongoose';
import Kayak from './src/models/kayak';
import dotenv from 'dotenv';

dotenv.config();

const seedKayaks = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL || '');
        console.log('Connected to database');

        // Clear existing kayaks
        await Kayak.deleteMany({});
        console.log('Cleared existing kayaks');

        // Add sample kayaks
        // Prototype: Using 1 real TTLock lock, can add more when you get additional locks
        const kayaks = await Kayak.insertMany([
            {
                name: 'Kayak 1 - Blue',
                lockId: 25440939, // Your actual TTLock lock ID
                isAvailable: true,
                location: 'Dock A - Slot 1'
            }
            // When you get more locks, add them here:
            // {
            //     name: 'Kayak 2 - Red',
            //     lockId: YOUR_LOCK_ID_HERE,
            //     isAvailable: true,
            //     location: 'Dock A - Slot 2'
            // },
        ]);

        console.log('Added kayaks:');
        kayaks.forEach((kayak: any) => {
            console.log(`  ${kayak.name} (ID: ${kayak._id}) - ${kayak.location}`);
        });

        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding kayaks:', error);
        process.exit(1);
    }
};

seedKayaks();
