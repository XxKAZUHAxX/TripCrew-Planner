import { Schema, model, type Types, type HydratedDocument } from 'mongoose';
import type { AvailabilityStatus } from '@tripcrew/shared';

export type { AvailabilityStatus };
export const AVAILABILITY_STATUSES: readonly AvailabilityStatus[] = [
    'pending',
    'submitted',
    'opted_out',
];

// Separate collection (Feature 2, Option C): clean per-member upserts, no write
// contention on a shared trip document, and native aggregation for the heatmap.
export interface IAvailability {
    tripId: Types.ObjectId;
    userId: Types.ObjectId;
    // UTC YYYY-MM-DD strings.
    dates: string[];
    // Response state so "never responded" and "opted out" are distinguishable
    // from "submitted with no dates" (Feature 1).
    status: AvailabilityStatus;
    createdAt: Date;
    updatedAt: Date;
}

const availabilitySchema = new Schema<IAvailability>(
    {
        tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        dates: { type: [String], default: [] },
        status: {
            type: String,
            enum: AVAILABILITY_STATUSES,
            required: true,
            default: 'pending',
        },
    },
    { timestamps: true }
);

availabilitySchema.index({ tripId: 1, userId: 1 }, { unique: true });
availabilitySchema.index({ tripId: 1 });

export type AvailabilityDocument = HydratedDocument<IAvailability>;

const Availability = model<IAvailability>('Availability', availabilitySchema);
export default Availability;
