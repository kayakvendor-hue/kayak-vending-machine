import { Schema, model } from 'mongoose';

const rentalSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    kayakId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Kayak'
    },
    rentalStart: {
        type: Date,
        required: true
    },
    rentalEnd: {
        type: Date,
        required: true
    },
    passcode: {
        type: String,
        required: true
    },
    passcodeId: {
        type: Number,
        required: false
    },
    paymentIntentId: {
        type: String,
        required: false
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'succeeded', 'failed', 'refunded'],
        default: 'pending'
    },
    amount: {
        type: Number,
        required: false
    },
    pickupPhotoUrl: {
        type: String,
        required: false
    },
    returnPhotoUrl: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Rental = model('Rental', rentalSchema);

export default Rental;