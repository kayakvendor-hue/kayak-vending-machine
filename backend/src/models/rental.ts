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
    // Kayak lock (for accessing the kayak)
    kayakLockId: {
        type: Number,
        required: false,
        description: 'TTLock ID for kayak lock'
    },
    // Lifevest/Paddle lock (for lifevest and paddle)
    lifevestLockId: {
        type: Number,
        required: false,
        description: 'TTLock ID for lifevest/paddle lock'
    },
    rentalStart: {
        type: Date,
        required: true
    },
    rentalEnd: {
        type: Date,
        required: true
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
    // Kayak lock status
    kayakLockStatus: {
        type: Number,
        enum: [0, 1, 2],
        default: 2,
        description: '0=locked, 1=unlocked, 2=unknown'
    },
    kayakLockLastUpdate: {
        type: Date,
        required: false,
        description: 'When kayak lock status was last checked'
    },
    // Lifevest lock status
    lifevestLockStatus: {
        type: Number,
        enum: [0, 1, 2],
        default: 2,
        description: '0=locked, 1=unlocked, 2=unknown'
    },
    lifevestLockLastUpdate: {
        type: Date,
        required: false,
        description: 'When lifevest lock status was last checked'
    },
    remoteUnlockTriggered: {
        type: Boolean,
        default: false,
        description: 'Whether remote unlock has been triggered for either lock'
    },
    rentalStatus: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    lastLateChargeTime: {
        type: Date,
        required: false,
        description: 'When the last late return charge was applied'
    },
    totalLateChargesApplied: {
        type: Number,
        default: 0,
        description: 'Total number of hourly late charges applied to this rental'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Rental = model('Rental', rentalSchema);

export default Rental;