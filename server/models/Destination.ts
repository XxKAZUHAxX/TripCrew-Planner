import { Schema, model, type Types, type HydratedDocument } from 'mongoose';

export interface IDestination {
    tripId: Types.ObjectId;
    name: string;
    description: string;
    proposedBy: Types.ObjectId;
    // Freeform per-person estimate in ₱; null until someone estimates it.
    estimatedCost: number | null;
    createdAt: Date;
    updatedAt: Date;
}

const destinationSchema = new Schema<IDestination>(
    {
        tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        proposedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        estimatedCost: { type: Number, default: null, min: 0 },
    },
    { timestamps: true }
);

destinationSchema.index({ tripId: 1 });
destinationSchema.index({ tripId: 1, proposedBy: 1 });

export type DestinationDocument = HydratedDocument<IDestination>;

const Destination = model<IDestination>('Destination', destinationSchema);
export default Destination;
