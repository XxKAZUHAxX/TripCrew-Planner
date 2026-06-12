import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

// URL-safe, unambiguous alphabet for invite codes.
const generateInviteCode = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

export const TRIP_STATUS = ['voting', 'decided', 'archived'];

// Checklist template: the shared task plus which members have completed it.
// Per-member completion state == membership in completedBy[]. (Feature 4, Decision 2)
const checklistTaskSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const tripSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      default: () => generateInviteCode(),
    },
    inviteActive: { type: Boolean, required: true, default: true },
    status: { type: String, enum: TRIP_STATUS, required: true, default: 'voting' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    votingDeadline: { type: Date, default: null },
    winningDestination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      default: null,
    },
    // Playbook instructions stored inline (Feature 4, Decision 1).
    instructions: { type: String, default: '' },
    checklistTemplates: { type: [checklistTaskSchema], default: [] },
  },
  { timestamps: true }
);

tripSchema.index({ members: 1 });
tripSchema.index({ creator: 1 });

tripSchema.methods.isMember = function isMember(userId) {
  return this.members.some((m) => m.equals(userId));
};

tripSchema.methods.isCreator = function isCreator(userId) {
  return this.creator.equals(userId);
};

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
