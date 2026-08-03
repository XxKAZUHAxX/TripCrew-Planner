import { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';
import { customAlphabet } from 'nanoid';
import type { TripStatus } from '@tripcrew/shared';

export type { TripStatus };

// URL-safe, unambiguous alphabet for invite codes.
const generateInviteCode = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

export const TRIP_STATUS: readonly TripStatus[] = ['voting', 'decided', 'archived'];

// Checklist template: the shared task plus which members have completed it.
// Per-member completion state == membership in completedBy[]. (Feature 4, Decision 2)
export interface IChecklistTask {
    label: string;
    createdBy: Types.ObjectId;
    completedBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ITrip {
    title: string;
    creator: Types.ObjectId;
    members: Types.ObjectId[];
    inviteCode: string;
    inviteActive: boolean;
    status: TripStatus;
    startDate: Date | null;
    endDate: Date | null;
    votingDeadline: Date | null;
    availabilityDeadline: Date | null;
    winningDestination: Types.ObjectId | null;
    // Playbook instructions stored inline (Feature 4, Decision 1).
    instructions: string;
    // Members (besides the creator) granted playbook edit rights (Feature 9).
    playbookEditors: Types.ObjectId[];
    checklistTemplates: Types.DocumentArray<IChecklistTask>;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITripMethods {
    isMember(userId: Types.ObjectId | string): boolean;
    isCreator(userId: Types.ObjectId | string): boolean;
    canEditPlaybook(userId: Types.ObjectId | string): boolean;
}

type TripModel = Model<ITrip, Record<string, never>, ITripMethods>;

const checklistTaskSchema = new Schema<IChecklistTask>(
    {
        label: { type: String, required: true, trim: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        completedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

const tripSchema = new Schema<ITrip, TripModel, ITripMethods>(
    {
        title: { type: String, required: true, trim: true },
        creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
        availabilityDeadline: { type: Date, default: null },
        winningDestination: {
            type: Schema.Types.ObjectId,
            ref: 'Destination',
            default: null,
        },
        instructions: { type: String, default: '' },
        playbookEditors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        checklistTemplates: { type: [checklistTaskSchema], default: [] },
    },
    { timestamps: true }
);

tripSchema.index({ members: 1 });
tripSchema.index({ creator: 1 });

tripSchema.methods.isMember = function isMember(userId: Types.ObjectId | string): boolean {
    return this.members.some((m) => m.equals(userId));
};

tripSchema.methods.isCreator = function isCreator(userId: Types.ObjectId | string): boolean {
    return this.creator.equals(userId);
};

// Creator always qualifies; other members must be listed in playbookEditors.
tripSchema.methods.canEditPlaybook = function canEditPlaybook(
    userId: Types.ObjectId | string
): boolean {
    return this.isCreator(userId) || this.playbookEditors.some((e) => e.equals(userId));
};

export type TripDocument = HydratedDocument<ITrip, ITripMethods>;

const Trip = model<ITrip, TripModel>('Trip', tripSchema);
export default Trip;
