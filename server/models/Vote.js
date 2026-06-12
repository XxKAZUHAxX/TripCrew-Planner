import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Ordered ranking: index 0 = 1st choice. May be a subset of destinations.
    ranking: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }],
    // Increments on every re-submission. Sole input for "The Overthinker" badge.
    changeCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// One vote document per user per trip.
voteSchema.index({ tripId: 1, userId: 1 }, { unique: true });
// Earliest voter lookup for "The Hype Machine" badge.
voteSchema.index({ tripId: 1, createdAt: 1 });

const Vote = mongoose.model('Vote', voteSchema);
export default Vote;
