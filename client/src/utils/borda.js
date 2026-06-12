// Borda helper for the client (mirrors server logic) — used to preview scores
// locally if needed. The authoritative scores still come from the API.
export function bordaPoints(rankLength, index) {
  return rankLength - index;
}
