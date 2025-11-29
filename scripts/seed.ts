import { User } from '../backend/src/models/user';
import { Waiver } from '../backend/src/models/waiver';
import { Rental } from '../backend/src/models/rental';
import { connectToDatabase } from '../backend/src/config/db';

async function seedDatabase() {
    const db = await connectToDatabase();

    // Seed Users
    const users = [
        { username: 'john_doe', email: 'john@example.com', password: 'password123' },
        { username: 'jane_smith', email: 'jane@example.com', password: 'password456' }
    ];
    await User.insertMany(users);

    // Seed Waivers
    const waivers = [
        { userId: users[0]._id, signed: true, dateSigned: new Date() },
        { userId: users[1]._id, signed: true, dateSigned: new Date() }
    ];
    await Waiver.insertMany(waivers);

    // Seed Rentals
    const rentals = [
        { userId: users[0]._id, kayakId: 'kayak1', rentalDate: new Date(), returnDate: null },
        { userId: users[1]._id, kayakId: 'kayak2', rentalDate: new Date(), returnDate: null }
    ];
    await Rental.insertMany(rentals);

    console.log('Database seeded successfully');
    db.close();
}

seedDatabase().catch(err => {
    console.error('Error seeding database:', err);
});