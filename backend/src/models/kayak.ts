import { Schema, model } from 'mongoose';

const kayakSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    // Reference to which lock in the Lock collection (by designation)
    // e.g., "Kayak #1" matches locks with designation: "Kayak #1"
    lockDesignation: {
        type: String,
        required: false,
        description: 'Lock designation this kayak uses (e.g., "Kayak #1")'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    lockOnline: {
        type: Boolean,
        default: true,
        description: 'Whether the lock has signal/gateway connection'
    },
    lastLockStatusCheck: {
        type: Date,
        default: Date.now,
        description: 'When the lock status was last verified'
    },
    lockStatusReason: {
        type: String,
        enum: ['online', 'no-signal', 'gateway-offline', 'unknown'],
        default: 'online'
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Kayak = model('Kayak', kayakSchema);

export default Kayak;
