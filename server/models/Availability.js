import mongoose from 'mongoose';

// Separate collection (Feature 2, Option C): clean per-member upserts, no write
// contention on a shared trip document, and native aggregation for the heatmap.
const availabilitySchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // UTC YYYY-MM-DD strings.
    dates: { type: [String], default: [] },
  },
  { timestamps: true }
);

availabilitySchema.index({ tripId: 1, userId: 1 }, { unique: true });
availabilitySchema.index({ tripId: 1 });

const Availability = mongoose.model('Availability', availabilitySchema);
export default Availability;
