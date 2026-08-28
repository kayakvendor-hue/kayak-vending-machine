import mongoose, { Schema, Document } from 'mongoose';

export interface IPasscodeQueue extends Document {
    lockId: number;
    designation: string;
    passcodes: Array<{
        code: string;
        passcodeId: number;
        generatedAt: Date;
        startDate: number;
        endDate: number;
    }>;
    lastGenerated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PasscodeQueueSchema = new Schema(
    {
        lockId: { type: Number, required: true, unique: true },
        designation: { type: String, required: true },
        passcodes: [
            {
                code: { type: String, required: true },
                passcodeId: { type: Number, required: true },
                generatedAt: { type: Date, default: Date.now },
                startDate: { type: Number, required: true },
                endDate: { type: Number, required: true }
            }
        ],
        lastGenerated: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export default mongoose.model<IPasscodeQueue>('PasscodeQueue', PasscodeQueueSchema);
