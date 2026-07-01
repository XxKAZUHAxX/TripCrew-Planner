import type { Request, Response, NextFunction } from 'express';
import Vote, { type VoteDocument } from '../models/Vote.js';
import Destination, { type DestinationDocument } from '../models/Destination.js';
import type { TripDocument } from '../models/Trip.js';
import { computeArchetypes, ARCHETYPES } from '../utils/archetypes.js';
import { evaluateDeadlock } from '../utils/deadlock.js';
import { rankByScore } from '../utils/borda.js';

async function loadTripData(
    trip: TripDocument
): Promise<{ votes: VoteDocument[]; destinations: DestinationDocument[] }> {
    const [votes, destinations] = await Promise.all([
        Vote.find({ tripId: trip._id }),
        Destination.find({ tripId: trip._id }),
    ]);
    return { votes, destinations };
}

export async function getArchetypes(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const trip = req.trip;
        const { votes, destinations } = await loadTripData(trip);
        const badges = computeArchetypes({
            members: trip.members.map((m) => ({ id: m })),
            destinations,
            votes,
            votingDeadline: trip.votingDeadline,
        });
        res.json({ badges, definitions: ARCHETYPES });
    } catch (err) {
        next(err);
    }
}

// One-call dashboard: Borda scores + archetype badges + deadlock status.
export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trip = req.trip;
        const { votes, destinations } = await loadTripData(trip);

        const scores = rankByScore(votes, destinations);
        const badges = computeArchetypes({
            members: trip.members.map((m) => ({ id: m })),
            destinations,
            votes,
            votingDeadline: trip.votingDeadline,
        });
        const deadlock = evaluateDeadlock(votes, destinations, {
            memberCount: trip.members.length,
            votingDeadline: trip.votingDeadline,
        });

        res.json({
            scores,
            badges,
            definitions: ARCHETYPES,
            deadlock: {
                eligible: deadlock.eligible,
                tie: deadlock.tie,
                timeout: deadlock.timeout,
                slices: deadlock.slices,
            },
            status: trip.status,
            memberCount: trip.members.length,
            voterCount: votes.length,
            votedMemberIds: votes.map((v) => String(v.userId)),
        });
    } catch (err) {
        next(err);
    }
}
