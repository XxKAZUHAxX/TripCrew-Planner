// Borda count scoring.
// For a trip with N proposed destinations, a ballot's position i (0-based)
// earns (N - i) points. Unranked destinations earn 0.
// A destination's score is the sum across every member's ballot.

/**
 * @param {Array<{ranking: Array}>} votes  vote documents (each with a `ranking` array)
 * @param {Array} destinations  destination documents for the trip (defines N)
 * @returns {Map<string, number>} destinationId -> total score
 */
export function computeBordaScores(votes, destinations) {
  const N = destinations.length;
  const scores = new Map();
  for (const d of destinations) {
    scores.set(d._id.toString(), 0);
  }
  for (const vote of votes) {
    vote.ranking.forEach((destId, index) => {
      const key = destId.toString();
      // Ignore ranked ids that are no longer valid destinations.
      if (!scores.has(key)) return;
      const points = N - index;
      scores.set(key, scores.get(key) + points);
    });
  }
  return scores;
}

/**
 * Returns destinations sorted by descending score.
 * @returns {Array<{destId, name, score, budgetTier}>}
 */
export function rankByScore(votes, destinations) {
  const scores = computeBordaScores(votes, destinations);
  return destinations
    .map((d) => ({
      destId: d._id.toString(),
      name: d.name,
      budgetTier: d.budgetTier,
      score: scores.get(d._id.toString()) || 0,
    }))
    .sort((a, b) => b.score - a.score);
}
