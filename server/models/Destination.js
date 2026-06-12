import mongoose from 'mongoose';

export const BUDGET_TIERS = ['low', 'medium', 'high'];

const destinationSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    budgetTier: { type: String, enum: BUDGET_TIERS, required: true, default: 'medium' },
  },
  { timestamps: true }
);

destinationSchema.index({ tripId: 1 });
destinationSchema.index({ tripId: 1, proposedBy: 1 });

const Destination = mongoose.model('Destination', destinationSchema);
export default Destination;
