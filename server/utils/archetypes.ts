import { addHours } from 'date-fns';
import type { Types } from 'mongoose';
import type { ArchetypeDefinitions, ArchetypeName, BadgeMap } from '@tripcrew/shared';

export type { ArchetypeName };

// Computes archetype badges per member from already-fetched trip data.
// Badges are derived on-the-fly (never persisted) — see Feature 3 decision.

export const ARCHETYPES: ArchetypeDefinitions = {
    'The Dictator': 'Has proposed more than 5 destinations for this trip.',
    'The Ghost': 'Has cast zero votes with the deadline looming (<24h).',
    'The Accountant': 'Every destination they proposed is budget-tier "low".',
    'The Overthinker': 'Has changed their vote ranking more than 3 times.',
    'The Hype Machine': 'Was the first to cast a vote for this trip.',
};

type IdLike = Types.ObjectId | string;

interface ArchetypeMember {
    id: IdLike;
}

interface ArchetypeDestination {
    proposedBy: IdLike;
    budgetTier: string;
}

interface ArchetypeVote {
    userId: IdLike;
    changeCount: number;
    createdAt: Date | string;
}

export interface ArchetypeInput {
    members: ArchetypeMember[];
    destinations: ArchetypeDestination[];
    votes: ArchetypeVote[];
    votingDeadline: Date | null;
    /** Members who opted out — never earn "The Ghost" (Feature 1). */
    optedOutIds?: string[];
    now?: Date;
}

export function computeArchetypes({
    members,
    destinations,
    votes,
    votingDeadline,
    optedOutIds = [],
    now = new Date(),
}: ArchetypeInput): BadgeMap {
    const voteByUser = new Map<string, ArchetypeVote>();
    for (const v of votes) voteByUser.set(String(v.userId), v);
    const optedOut = new Set(optedOutIds.map(String));

    // Earliest voter (Hype Machine).
    let firstVoterId: string | null = null;
    let earliest = Infinity;
    for (const v of votes) {
        const t = new Date(v.createdAt).getTime();
        if (t < earliest) {
            earliest = t;
            firstVoterId = String(v.userId);
        }
    }

    const deadlineWithin24h =
        votingDeadline != null &&
        new Date(votingDeadline) >= now &&
        new Date(votingDeadline) <= addHours(now, 24);

    const result: BadgeMap = {};
    for (const member of members) {
        const uid = String(member.id);
        const badges: ArchetypeName[] = [];
        const myProposals = destinations.filter((d) => String(d.proposedBy) === uid);
        const myVote = voteByUser.get(uid);

        // The Dictator
        if (myProposals.length > 5) badges.push('The Dictator');

        // The Ghost
        if (!myVote && deadlineWithin24h && !optedOut.has(uid)) badges.push('The Ghost');

        // The Accountant
        if (myProposals.length >= 2 && myProposals.every((d) => d.budgetTier === 'low')) {
            badges.push('The Accountant');
        }

        // The Overthinker
        if (myVote && myVote.changeCount > 3) badges.push('The Overthinker');

        // The Hype Machine
        if (firstVoterId && uid === firstVoterId) badges.push('The Hype Machine');

        result[uid] = badges;
    }
    return result;
}
