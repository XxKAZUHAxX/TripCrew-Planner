// scores: [{ destId, name, score, budgetTier }] sorted desc by the API.
export default function ScoreBoard({ scores }) {
  const max = scores.reduce((m, s) => Math.max(m, s.score), 0);
  return (
    <div>
      <h2 className="h6">Live scores (Borda count)</h2>
      {scores.length === 0 && <p className="text-muted">No scores yet.</p>}
      {scores.map((s) => (
        <div key={s.destId} className="mb-2">
          <div className="d-flex justify-content-between small">
            <span>{s.name}</span>
            <span className="fw-bold">{s.score}</span>
          </div>
          <div className="progress" style={{ height: 8 }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: max > 0 ? `${(s.score / max) * 100}%` : '0%' }}
              aria-valuenow={s.score}
              aria-valuemin={0}
              aria-valuemax={max}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
