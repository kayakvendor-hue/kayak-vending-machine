import mongoose from 'mongoose';
import Kayak from '../src/models/kayak';
import Lock from '../src/models/lock';
import dotenv from 'dotenv';

dotenv.config();

async function fixRentalSetup() {
    try {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('DATABASE_URL not found in .env');

        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB\n');

        // Fix 1: Update storage lock to be temporarily available for testing
        console.log('🔧 Fix 1: Resetting storage lock status...');
        const storageLock = await Lock.findOneAndUpdate(
            { lockId: 25440939 },
            { status: 'available', currentRentalId: undefined },
            { new: true }
        );
        if (storageLock) {
            console.log(`   ✅ Storage lock status: ${storageLock.status}\n`);
        } else {
            console.log('   ❌ Storage lock not found\n');
        }

        // Fix 2: Set kayak lockDesignation to "Storage Box" (for testing)
        console.log('🔧 Fix 2: Setting kayak lockDesignation...');
        const kayak = await Kayak.findOneAndUpdate(
            { name: 'Kayak 1 - Blue' },
            { lockDesignation: 'Storage Box' },
            { new: true }
        );
        if (kayak) {
            console.log(`   ✅ Kayak lockDesignation: "${kayak.lockDesignation}"\n`);
        } else {
            console.log('   ❌ Kayak not found\n');
        }

        // Fix 3: Mark kayak as available
        console.log('🔧 Fix 3: Marking kayak as available...');
        const availableKayak = await Kayak.findOneAndUpdate(
            { name: 'Kayak 1 - Blue' },
            { isAvailable: true },
            { new: true }
        );
        if (availableKayak) {
            console.log(`   ✅ Kayak isAvailable: ${availableKayak.isAvailable}\n`);
        } else {
            console.log('   ❌ Kayak not found\n');
        }

        console.log('✅ All fixes applied! Ready to test rental.\n');
        console.log('⚠️  NOTE: The storage lock (25440939) is temporarily configured');
        console.log('   as "Kayak 1 - Blue" for testing purposes.');
        console.log('   When you get your kayak locks, update the kayaks with proper');
        console.log('   lockDesignations like "Kayak #1", "Kayak #2", etc.\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixRentalSetup();
