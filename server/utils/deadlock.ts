import { rankByScore, type ScoredDestination } from './borda.js';
import type { HydratedDocument } from 'mongoose';
import type { IVote } from '../models/Vote.js';
import type { IDestination } from '../models/Destination.js';

// Deadlock rule (Domain Rules):
//  - TIE: the two highest-scoring destinations have an equal total score, OR
//  - TIMEOUT: fewer than 50% of trip members have submitted a vote AND the
//    votingDeadline has passed.
// The Wheel's slices are the destinations involved in the tie; if fewer than 2,
// the top 2 by score.

export interface DeadlockTripInput {
    memberCount: number;
    votingDeadline: Date | null;
}

export interface DeadlockResult {
    eligible: boolean;
    tie: boolean;
    timeout: boolean;
    deadlinePassed: boolean;
    lowTurnout: boolean;
    ranked: ScoredDestination[];
    slices: ScoredDestination[];
}

export function evaluateDeadlock(
    votes: HydratedDocument<IVote>[],
    destinations: HydratedDocument<IDestination>[],
    trip: DeadlockTripInput,
    now: Date = new Date()
): DeadlockResult {
    const ranked = rankByScore(votes, destinations);
    const memberCount = trip.memberCount;
    const voterCount = votes.length;

    // A tie at zero (no votes yet) is not a deadlock, just an empty race.
    const [first, second] = ranked;
    const tie = Boolean(first && second && first.score > 0 && first.score === second.score);

    const deadlinePassed = trip.votingDeadline ? now >= new Date(trip.votingDeadline) : false;
    const lowTurnout = memberCount > 0 ? voterCount / memberCount < 0.5 : true;
    const timeout = deadlinePassed && lowTurnout;

    const eligible = Boolean(tie || timeout);

    let slices: ScoredDestination[] = [];
    if (eligible && first) {
        const topScore = first.score;
        slices = ranked.filter((d) => d.score === topScore);
        if (slices.length < 2) {
            slices = ranked.slice(0, Math.min(2, ranked.length));
        }
    }

    return { eligible, tie, timeout, deadlinePassed, lowTurnout, ranked, slices };
}
