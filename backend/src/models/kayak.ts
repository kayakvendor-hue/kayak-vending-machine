import { Schema, model } from 'mongoose';

const kayakSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    lockId: {
        type: Number,
        required: true,
        unique: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    location: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Kayak = model('Kayak', kayakSchema);

export default Kayak;
