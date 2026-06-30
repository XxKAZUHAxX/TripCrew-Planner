import { Schema, model, type Types, type HydratedDocument } from 'mongoose';

export const BUDGET_TIERS = ['low', 'medium', 'high'] as const;
export type BudgetTier = (typeof BUDGET_TIERS)[number];

export interface IDestination {
    tripId: Types.ObjectId;
    name: string;
    description: string;
    proposedBy: Types.ObjectId;
    budgetTier: BudgetTier;
    createdAt: Date;
    updatedAt: Date;
}

const destinationSchema = new Schema<IDestination>(
    {
        tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        proposedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        budgetTier: { type: String, enum: BUDGET_TIERS, required: true, default: 'medium' },
    },
    { timestamps: true }
);

destinationSchema.index({ tripId: 1 });
destinationSchema.index({ tripId: 1, proposedBy: 1 });

export type DestinationDocument = HydratedDocument<IDestination>;

const Destination = model<IDestination>('Destination', destinationSchema);
export default Destination;
