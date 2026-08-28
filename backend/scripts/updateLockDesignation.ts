import mongoose from 'mongoose';
import Lock from '../src/models/lock';
import dotenv from 'dotenv';

dotenv.config();

async function updateLockDesignation() {
    try {
        // Connect to MongoDB
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL not found in .env');
        }

        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB');

        // Update the lifevest lock designation
        const updatedLock = await Lock.findOneAndUpdate(
            { lockId: 25440939 },
            { designation: 'Storage Box' },
            { new: true }
        );

        if (updatedLock) {
            console.log('✅ Lock designation updated successfully!');
            console.log('   Lock ID: 25440939');
            console.log('   New Designation: Storage Box');
            console.log('   Status: ' + updatedLock.status);
        } else {
            console.log('❌ Lock not found');
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating lock:', error);
        process.exit(1);
    }
}

updateLockDesignation();
