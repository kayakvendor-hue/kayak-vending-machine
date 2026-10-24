import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user';
import Waiver from '../src/models/waiver';
import Rental from '../src/models/rental';

dotenv.config();

async function resetCollections() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL not found in .env');
    }

    await mongoose.connect(dbUrl);
    console.log(`✅ Connected to database: "${mongoose.connection.db?.databaseName}"\n`);

    const beforeUsers = await User.countDocuments();
    const beforeWaivers = await Waiver.countDocuments();
    const beforeRentals = await Rental.countDocuments();
    console.log(`Before: users=${beforeUsers}, waivers=${beforeWaivers}, rentals=${beforeRentals}`);

    const userResult = await User.deleteMany({});
    const waiverResult = await Waiver.deleteMany({});
    const rentalResult = await Rental.deleteMany({});

    console.log(`\n🗑️ Deleted: users=${userResult.deletedCount}, waivers=${waiverResult.deletedCount}, rentals=${rentalResult.deletedCount}`);

    await mongoose.disconnect();
}

resetCollections().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
