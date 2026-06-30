import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Vote, { type VoteDocument } from '../models/Vote.js';
import Destination, { type DestinationDocument } from '../models/Destination.js';
import type { TripDocument } from '../models/Trip.js';
import { evaluateDeadlock } from '../utils/deadlock.js';

async function loadTripData(
    trip: TripDocument
): Promise<{ votes: VoteDocument[]; destinations: DestinationDocument[] }> {
    const [votes, destinations] = await Promise.all([
        Vote.find({ tripId: trip._id }),
        Destination.find({ tripId: trip._id }),
    ]);
    return { votes, destinations };
}

// Is the wheel currently eligible? What slices would it show?
export async function getWheelStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const trip = req.trip;
        const { votes, destinations } = await loadTripData(trip);
        const deadlock = evaluateDeadlock(votes, destinations, {
            memberCount: trip.members.length,
            votingDeadline: trip.votingDeadline,
        });
        res.json({
            eligible: deadlock.eligible && trip.status === 'voting',
            tie: deadlock.tie,
            timeout: deadlock.timeout,
            slices: deadlock.slices,
            status: trip.status,
        });
    } catch (err) {
        next(err);
    }
}

// Creator-only. The SERVER authoritatively picks the winner among the tied
// slices, persists it, and returns the id. The client animates TO this index,
// so the wheel can never visually disagree with the stored outcome.
export async function spinWheel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trip = req.trip;
        if (trip.status !== 'voting') {
            res.status(409).json({ message: 'Trip is no longer in the voting phase' });
            return;
        }
        const { votes, destinations } = await loadTripData(trip);
        const deadlock = evaluateDeadlock(votes, destinations, {
            memberCount: trip.members.length,
            votingDeadline: trip.votingDeadline,
        });
        if (!deadlock.eligible) {
            res.status(409).json({ message: 'No deadlock: the wheel cannot be spun yet' });
            return;
        }
        const slices = deadlock.slices;
        if (slices.length === 0) {
            res.status(409).json({ message: 'No destinations available to spin' });
            return;
        }

        const winnerIndex = Math.floor(Math.random() * slices.length);
        const winner = slices[winnerIndex]!;

        trip.winningDestination = new Types.ObjectId(winner.destId);
        trip.status = 'decided';
        await trip.save();

        res.json({
            winningDestinationId: winner.destId,
            winnerIndex,
            slices,
            status: trip.status,
        });
    } catch (err) {
        next(err);
    }
}
