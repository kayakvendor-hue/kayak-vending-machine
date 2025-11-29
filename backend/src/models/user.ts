import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    username: {
        type: String,
        required: false,
        unique: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    waiverSigned: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    },
    stripeCustomerId: {
        type: String,
        required: false
    },
    defaultPaymentMethodId: {
        type: String,
        required: false
    },
    cardLast4: {
        type: String,
        required: false
    },
    cardBrand: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = model('User', userSchema);

export default User;