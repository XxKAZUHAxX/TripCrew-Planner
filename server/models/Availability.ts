import { Schema, model, type Types, type HydratedDocument } from 'mongoose';

// Separate collection (Feature 2, Option C): clean per-member upserts, no write
// contention on a shared trip document, and native aggregation for the heatmap.
export interface IAvailability {
    tripId: Types.ObjectId;
    userId: Types.ObjectId;
    // UTC YYYY-MM-DD strings.
    dates: string[];
    createdAt: Date;
    updatedAt: Date;
}

const availabilitySchema = new Schema<IAvailability>(
    {
        tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        dates: { type: [String], default: [] },
    },
    { timestamps: true }
);

availabilitySchema.index({ tripId: 1, userId: 1 }, { unique: true });
availabilitySchema.index({ tripId: 1 });

export type AvailabilityDocument = HydratedDocument<IAvailability>;

const Availability = model<IAvailability>('Availability', availabilitySchema);
export default Availability;
