import { Schema, model, type Types, type HydratedDocument } from 'mongoose';

export interface IVote {
    tripId: Types.ObjectId;
    userId: Types.ObjectId;
    // Ordered ranking: index 0 = 1st choice. May be a subset of destinations.
    ranking: Types.ObjectId[];
    // Increments on every re-submission. Sole input for "The Overthinker" badge.
    changeCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const voteSchema = new Schema<IVote>(
    {
        tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        ranking: [{ type: Schema.Types.ObjectId, ref: 'Destination' }],
        changeCount: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

// One vote document per user per trip.
voteSchema.index({ tripId: 1, userId: 1 }, { unique: true });
// Earliest voter lookup for "The Hype Machine" badge.
voteSchema.index({ tripId: 1, createdAt: 1 });

export type VoteDocument = HydratedDocument<IVote>;

const Vote = model<IVote>('Vote', voteSchema);
export default Vote;
