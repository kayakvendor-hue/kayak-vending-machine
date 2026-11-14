import { Schema, model } from 'mongoose';

const waiverSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    signature: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    renter: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        emergencyContact: {
            name: { type: String, required: true },
            relationship: { type: String, required: true },
            phone: { type: String, required: true }
        }
    },
    dateSigned: {
        type: Date,
        default: Date.now
    }
});

const Waiver = model('Waiver', waiverSchema);

export default Waiver;