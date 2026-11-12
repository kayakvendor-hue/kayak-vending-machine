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
    // The answers entered on the waiver form. The PDF is built from this on request
    // rather than stored. Records signed before this field existed have no form.
    form: {
        type: Schema.Types.Mixed
    }
});

const Waiver = model('Waiver', waiverSchema);

export default Waiver;