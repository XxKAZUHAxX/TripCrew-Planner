import { Schema, model, type Types, type HydratedDocument } from 'mongoose';

// A member's comment on a destination (embedded subdoc, Feature 4).
export interface IDestinationComment {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDestination {
    tripId: Types.ObjectId;
    name: string;
    description: string;
    proposedBy: Types.ObjectId;
    // Freeform per-person estimate in ₱; null until someone estimates it.
    estimatedCost: number | null;
    // Collaborative "make the case" details (Feature 4).
    notes: string;
    links: string[];
    tags: string[];
    comments: Types.DocumentArray<IDestinationComment>;
    // Pinned map location (Feature 5); null until someone drops a pin.
    location: { lat: number; lng: number } | null;
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IDestinationComment>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

const locationSchema = new Schema<{ lat: number; lng: number }>(
    {
        lat: { type: Number, required: true, min: -90, max: 90 },
        lng: { type: Number, required: true, min: -180, max: 180 },
    },
    { _id: false }
);

const destinationSchema = new Schema<IDestination>(
    {
        tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        proposedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        estimatedCost: { type: Number, default: null, min: 0 },
        notes: { type: String, default: '' },
        links: { type: [String], default: [] },
        tags: { type: [String], default: [] },
        comments: { type: [commentSchema], default: [] },
        location: { type: locationSchema, default: null },
    },
    { timestamps: true }
);

destinationSchema.index({ tripId: 1 });
destinationSchema.index({ tripId: 1, proposedBy: 1 });

export type DestinationDocument = HydratedDocument<IDestination>;

const Destination = model<IDestination>('Destination', destinationSchema);
export default Destination;
