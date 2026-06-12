import { rankByScore } from './borda.js';

// Deadlock rule (Domain Rules):
//  - TIE: the two highest-scoring destinations have an equal total score, OR
//  - TIMEOUT: fewer than 50% of trip members have submitted a vote AND the
//    votingDeadline has passed.
// The Wheel's slices are the destinations involved in the tie; if fewer than 2,
// the top 2 by score.

/**
 * @param {Array} votes
 * @param {Array} destinations
 * @param {{ memberCount: number, votingDeadline: Date|null }} trip
 * @param {Date} now
 */
export function evaluateDeadlock(votes, destinations, trip, now = new Date()) {
  const ranked = rankByScore(votes, destinations);
  const memberCount = trip.memberCount;
  const voterCount = votes.length;

  // A tie at zero (no votes yet) is not a deadlock, just an empty race.
  const tie =
    ranked.length >= 2 && ranked[0].score > 0 && ranked[0].score === ranked[1].score;

  const deadlinePassed = trip.votingDeadline ? now >= new Date(trip.votingDeadline) : false;
  const lowTurnout = memberCount > 0 ? voterCount / memberCount < 0.5 : true;
  const timeout = deadlinePassed && lowTurnout;

  const eligible = Boolean(tie || timeout);

  let slices = [];
  if (eligible) {
    if (ranked.length > 0) {
      const topScore = ranked[0].score;
      slices = ranked.filter((d) => d.score === topScore);
      if (slices.length < 2) {
        slices = ranked.slice(0, Math.min(2, ranked.length));
      }
    }
  }

  return { eligible, tie, timeout, deadlinePassed, lowTurnout, ranked, slices };
}
