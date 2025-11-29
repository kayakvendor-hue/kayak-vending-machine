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
    dateSigned: {
        type: Date,
        default: Date.now
    }
});

const Waiver = model('Waiver', waiverSchema);

export default Waiver;