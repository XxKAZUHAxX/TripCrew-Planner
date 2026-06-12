import { addHours } from 'date-fns';

// Computes archetype badges per member from already-fetched trip data.
// Badges are derived on-the-fly (never persisted) — see Feature 3 decision.
//
// Inputs are plain arrays/objects so this is pure and unit-testable:
//   members:      [{ id }]
//   destinations: [{ proposedBy, budgetTier }]
//   votes:        [{ userId, changeCount, createdAt }]
//   votingDeadline: Date | null
//   now:          Date

export const ARCHETYPES = {
  'The Dictator': 'Has proposed more than 5 destinations for this trip.',
  'The Ghost': 'Has cast zero votes with the deadline looming (<24h).',
  'The Accountant': 'Every destination they proposed is budget-tier "low".',
  'The Overthinker': 'Has changed their vote ranking more than 3 times.',
  'The Hype Machine': 'Was the first to cast a vote for this trip.',
};

export function computeArchetypes({ members, destinations, votes, votingDeadline, now = new Date() }) {
  const voteByUser = new Map();
  for (const v of votes) voteByUser.set(String(v.userId), v);

  // Earliest voter (Hype Machine).
  let firstVoterId = null;
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

  const result = {};
  for (const member of members) {
    const uid = String(member.id);
    const badges = [];
    const myProposals = destinations.filter((d) => String(d.proposedBy) === uid);
    const myVote = voteByUser.get(uid);

    // The Dictator
    if (myProposals.length > 5) badges.push('The Dictator');

    // The Ghost
    if (!myVote && deadlineWithin24h) badges.push('The Ghost');

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
