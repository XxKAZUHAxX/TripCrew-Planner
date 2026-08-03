import type { Request, Response, NextFunction } from 'express';
import Vote, { type VoteDocument } from '../models/Vote.js';
import Destination, { type DestinationDocument } from '../models/Destination.js';
import Availability from '../models/Availability.js';
import type { AvailabilityStatus } from '../models/Availability.js';
import type { TripDocument } from '../models/Trip.js';
import { computeArchetypes, ARCHETYPES } from '../utils/archetypes.js';
import { evaluateDeadlock } from '../utils/deadlock.js';
import { rankByScore } from '../utils/borda.js';
import { computeParticipation } from '../utils/participation.js';

interface MemberAvailability {
    userId: unknown;
    status: AvailabilityStatus;
}

async function loadTripData(trip: TripDocument): Promise<{
    votes: VoteDocument[];
    destinations: DestinationDocument[];
    availabilities: MemberAvailability[];
}> {
    const [votes, destinations, availabilities] = await Promise.all([
        Vote.find({ tripId: trip._id }),
        Destination.find({ tripId: trip._id }),
        Availability.find({ tripId: trip._id })
            .select('userId status')
            .lean<MemberAvailability[]>(),
    ]);
    return { votes, destinations, availabilities };
}

export async function getArchetypes(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const trip = req.trip;
        const { votes, destinations, availabilities } = await loadTripData(trip);
        const { optedOutIds } = computeParticipation({
            memberIds: trip.members.map((m) => String(m)),
            availabilities,
            availabilityDeadline: trip.availabilityDeadline,
        });
        const badges = computeArchetypes({
            members: trip.members.map((m) => ({ id: m })),
            destinations,
            votes,
            votingDeadline: trip.votingDeadline,
            optedOutIds,
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
        const { votes, destinations, availabilities } = await loadTripData(trip);
        const { optedOutIds, effectiveMemberCount } = computeParticipation({
            memberIds: trip.members.map((m) => String(m)),
            availabilities,
            availabilityDeadline: trip.availabilityDeadline,
        });

        const scores = rankByScore(votes, destinations);
        const badges = computeArchetypes({
            members: trip.members.map((m) => ({ id: m })),
            destinations,
            votes,
            votingDeadline: trip.votingDeadline,
            optedOutIds,
        });
        const deadlock = evaluateDeadlock(votes, destinations, {
            memberCount: trip.members.length,
            effectiveMemberCount,
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
            optedOutMemberIds: optedOutIds,
        });
    } catch (err) {
        next(err);
    }
}
