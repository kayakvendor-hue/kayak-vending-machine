import mongoose from 'mongoose';
import Lock from '../src/models/lock';
import dotenv from 'dotenv';

dotenv.config();

async function addLifevestLock() {
    try {
        // Connect to MongoDB
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL not found in .env');
        }

        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB');

        // Add lifevest lock
        const lifevestLock = await Lock.create({
            lockId: 25440939,
            designation: 'Lifevest Pool',
            status: 'available',
            currentRentalId: undefined,
            maintenanceNotes: 'Initial lifevest lock'
        });

        console.log('✅ Lifevest lock added successfully!');
        console.log('   Lock ID: 25440939');
        console.log('   Designation: Lifevest Pool');
        console.log('   Status: available');
        console.log('   Database ID:', lifevestLock._id);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding lifevest lock:', error);
        process.exit(1);
    }
}

addLifevestLock();
