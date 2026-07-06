// Borda count scoring.
// For a trip with N proposed destinations, a ballot's position i (0-based)
// earns (N - i) points. Unranked destinations earn 0.
// A destination's score is the sum across every member's ballot.
import type { HydratedDocument } from 'mongoose';
import type { ScoredDestination } from '@tripcrew/shared';
import type { IVote } from '../models/Vote.js';
import type { IDestination } from '../models/Destination.js';

export type { ScoredDestination };

type VoteDoc = HydratedDocument<IVote>;
type DestinationDoc = HydratedDocument<IDestination>;

/** Returns a map of destinationId -> total Borda score. */
export function computeBordaScores(
    votes: VoteDoc[],
    destinations: DestinationDoc[]
): Map<string, number> {
    const N = destinations.length;
    const scores = new Map<string, number>();
    for (const d of destinations) {
        scores.set(d._id.toString(), 0);
    }
    for (const vote of votes) {
        vote.ranking.forEach((destId, index) => {
            const key = destId.toString();
            // Ignore ranked ids that are no longer valid destinations.
            if (!scores.has(key)) return;
            const points = N - index;
            scores.set(key, (scores.get(key) ?? 0) + points);
        });
    }
    return scores;
}

/** Returns destinations sorted by descending score. */
export function rankByScore(votes: VoteDoc[], destinations: DestinationDoc[]): ScoredDestination[] {
    const scores = computeBordaScores(votes, destinations);
    return destinations
        .map((d) => ({
            destId: d._id.toString(),
            name: d.name,
            estimatedCost: d.estimatedCost,
            score: scores.get(d._id.toString()) ?? 0,
        }))
        .sort((a, b) => b.score - a.score);
}
