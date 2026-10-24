import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user';

dotenv.config();

async function checkUsers() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL not found in .env');
    }

    await mongoose.connect(dbUrl);
    console.log(`✅ Connected. Actual database name in use: "${mongoose.connection.db?.databaseName}"\n`);

    const count = await User.countDocuments();
    console.log(`👤 Total users in "users" collection: ${count}\n`);

    const users = await User.find().select('email createdAt').lean();
    users.forEach(u => console.log(`  - ${u.email}  (created: ${u.createdAt})`));

    await mongoose.disconnect();
}

checkUsers().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
