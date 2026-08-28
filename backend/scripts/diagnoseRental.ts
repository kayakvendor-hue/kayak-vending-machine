import mongoose from 'mongoose';
import Kayak from '../src/models/kayak';
import Lock from '../src/models/lock';
import dotenv from 'dotenv';

dotenv.config();

async function diagnoseRentalIssue() {
    try {
        // Connect to MongoDB
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL not found in .env');
        }

        await mongoose.connect(dbUrl);
        console.log('✅ Connected to MongoDB\n');

        // Check locks
        console.log('📦 LOCKS COLLECTION:');
        const locks = await Lock.find();
        if (locks.length === 0) {
            console.log('❌ No locks found!');
        } else {
            locks.forEach(lock => {
                console.log(`  - Lock ID: ${lock.lockId}, Designation: "${lock.designation}", Status: ${lock.status}`);
            });
        }

        console.log('\n🚤 KAYAKS COLLECTION:');
        const kayaks = await Kayak.find();
        if (kayaks.length === 0) {
            console.log('❌ No kayaks found!');
        } else {
            kayaks.forEach(kayak => {
                console.log(`  - Name: "${kayak.name}"`);
                console.log(`    lockDesignation: ${kayak.lockDesignation || '❌ NOT SET'}`);
                console.log(`    isAvailable: ${kayak.isAvailable}`);
                console.log(`    location: ${kayak.location}\n`);
            });
        }

        // Check if there's a matching lock for the kayak
        console.log('🔍 CHECKING LOCK MATCHES:');
        for (const kayak of kayaks) {
            if (kayak.lockDesignation) {
                const matchingLock = await Lock.findOne({ designation: kayak.lockDesignation });
                if (matchingLock) {
                    console.log(`✅ "${kayak.name}" → Found lock "${kayak.lockDesignation}" (ID: ${matchingLock.lockId})`);
                } else {
                    console.log(`❌ "${kayak.name}" → Lock "${kayak.lockDesignation}" NOT FOUND in locks collection`);
                }
            } else {
                console.log(`❌ "${kayak.name}" → No lockDesignation set!`);
            }
        }

        console.log('\n✅ Diagnosis complete');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

diagnoseRentalIssue();
