import { Schema, model } from 'mongoose';

const lockSchema = new Schema({
    lockId: {
        type: Number,
        required: true,
        unique: true,
        description: 'TTLock ID number for this physical lock'
    },
    designation: {
        type: String,
        required: true,
        description: 'Purpose of this lock: "Kayak #1", "Kayak #2", "Lifevest Pool", "Storage", etc.'
    },
    status: {
        type: String,
        enum: ['available', 'in-use', 'maintenance', 'retired'],
        default: 'available',
        description: 'Current status of the lock'
    },
    currentRentalId: {
        type: Schema.Types.ObjectId,
        ref: 'Rental',
        required: false,
        description: 'Current rental using this lock (if in-use)'
    },
    lastStatusUpdate: {
        type: Date,
        default: Date.now,
        description: 'When the lock status was last updated'
    },
    maintenanceNotes: {
        type: String,
        required: false,
        description: 'Any maintenance notes if lock is in maintenance'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Lock = model('Lock', lockSchema);

export default Lock;
