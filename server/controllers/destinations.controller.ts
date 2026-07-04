import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Destination from '../models/Destination.js';

// Validates a freeform estimated cost: null clears it, otherwise a finite
// non-negative number. Returns true when the value is acceptable.
function isValidCost(value: unknown): value is number | null {
    return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

export async function proposeDestination(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, description, estimatedCost } = req.body;
        if (!name) {
            res.status(400).json({ message: 'name is required' });
            return;
        }
        if (req.trip.status !== 'voting') {
            res.status(403).json({ message: 'Destination proposals are closed for this trip.' });
            return;
        }
        if (estimatedCost !== undefined && !isValidCost(estimatedCost)) {
            res.status(400).json({ message: 'estimatedCost must be a non-negative number or null' });
            return;
        }
        const destination = await Destination.create({
            tripId: req.trip._id,
            name,
            description: description || '',
            estimatedCost: estimatedCost === undefined ? null : estimatedCost,
            proposedBy: new Types.ObjectId(req.user.id),
        });
        res.status(201).json({ destination });
    } catch (err) {
        next(err);
    }
}

// Edit a destination's estimated cost at any time (Feature 7). Gated the same
// way as deletion: only the proposer or the trip creator.
export async function updateDestination(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { estimatedCost } = req.body;
        if (estimatedCost !== undefined && !isValidCost(estimatedCost)) {
            res.status(400).json({ message: 'estimatedCost must be a non-negative number or null' });
            return;
        }
        const destination = await Destination.findOne({
            _id: req.params.id,
            tripId: req.trip._id,
        });
        if (!destination) {
            res.status(404).json({ message: 'Destination not found' });
            return;
        }
        const isProposer = destination.proposedBy.equals(req.user.id);
        const isCreator = req.trip.isCreator(req.user.id);
        if (!isProposer && !isCreator) {
            res.status(403).json({ message: 'Only the proposer or trip creator can edit this' });
            return;
        }
        if (estimatedCost !== undefined) {
            destination.estimatedCost = estimatedCost;
        }
        await destination.save();
        res.json({ destination });
    } catch (err) {
        next(err);
    }
}

export async function listDestinations(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const destinations = await Destination.find({ tripId: req.trip._id })
            .populate('proposedBy', 'name email')
            .sort({ createdAt: 1 });
        res.json({ destinations });
    } catch (err) {
        next(err);
    }
}

export async function deleteDestination(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const destination = await Destination.findOne({
            _id: req.params.id,
            tripId: req.trip._id,
        });
        if (!destination) {
            res.status(404).json({ message: 'Destination not found' });
            return;
        }
        // Only the proposer or the trip creator may delete.
        const isProposer = destination.proposedBy.equals(req.user.id);
        const isCreator = req.trip.isCreator(req.user.id);
        if (!isProposer && !isCreator) {
            res.status(403).json({ message: 'Only the proposer or trip creator can delete this' });
            return;
        }
        await destination.deleteOne();
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}
