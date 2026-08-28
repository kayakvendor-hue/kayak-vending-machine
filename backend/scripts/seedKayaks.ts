import mongoose from 'mongoose';
import Kayak from '../src/models/kayak';
import Lock from '../src/models/lock';
import dotenv from 'dotenv';

dotenv.config();

const seedKayaks = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL || '');
        console.log('Connected to database');

        // Clear existing data
        await Kayak.deleteMany({});
        await Lock.deleteMany({});
        console.log('Cleared existing kayaks and locks');

        // Add sample locks with their TTLock IDs
        const locks = await Lock.insertMany([
            {
                lockId: 18497357,
                designation: 'Kayak #1',
                status: 'available'
            },
            {
                lockId: 18499305,
                designation: 'Kayak #2',
                status: 'available'
            },
            {
                lockId: 18498521,
                designation: 'Kayak #3',
                status: 'available'
            },
            {
                lockId: 18501403,
                designation: 'Kayak #4',
                status: 'available'
            },
            {
                lockId: 25440939,
                designation: 'Lifejacket Box',
                status: 'available'
            },
        ]);

        console.log('Added locks:');
        locks.forEach((lock: any) => {
            console.log(`  ${lock.designation} - TTLock ID: ${lock.lockId}`);
        });

        // Add sample kayaks
        const kayaks = await Kayak.insertMany([
            {
                name: 'Kayak 1 - Blue',
                lockDesignation: 'Kayak #1',
                isAvailable: true,
                location: 'Dock A - Slot 1'
            },
            {
                name: 'Kayak 2 - Red',
                lockDesignation: 'Kayak #2',
                isAvailable: true,
                location: 'Dock A - Slot 2'
            },
            {
                name: 'Kayak 3 - Green',
                lockDesignation: 'Kayak #3',
                isAvailable: true,
                location: 'Dock A - Slot 3'
            },
            {
                name: 'Kayak 4 - Yellow',
                lockDesignation: 'Kayak #4',
                isAvailable: true,
                location: 'Dock B - Slot 1'
            },
        ]);

        console.log('\nAdded kayaks:');
        kayaks.forEach((kayak: any) => {
            console.log(`  ${kayak.name} (ID: ${kayak._id}) - ${kayak.location}`);
        });

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed - seeding complete!');
    } catch (error) {
        console.error('Error seeding kayaks:', error);
        process.exit(1);
    }
};

seedKayaks();
