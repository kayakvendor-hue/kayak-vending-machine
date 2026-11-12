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
    dateSigned: {
        type: Date,
        default: Date.now
    },
    // The completed waiver PDF (fields filled, signatures stamped). Excluded from
    // default queries because it is large; fetch with .select('+signedPdf').
    signedPdf: {
        type: Buffer,
        select: false
    }
});

const Waiver = model('Waiver', waiverSchema);

export default Waiver;