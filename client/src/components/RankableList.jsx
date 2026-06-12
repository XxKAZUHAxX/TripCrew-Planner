// Drag-to-rank list — no external library needed; pure React state.
// ranked: [{ _id, name }]
// unranked: [{ _id, name }]
// onRankingChange: (orderedIds) => void
export default function RankableList({ ranked, unranked, onRankingChange }) {
  function moveUp(index) {
    if (index === 0) return;
    const next = [...ranked];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onRankingChange(next.map((d) => d._id));
  }

  function moveDown(index) {
    if (index === ranked.length - 1) return;
    const next = [...ranked];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onRankingChange(next.map((d) => d._id));
  }

  function addToRanked(dest) {
    onRankingChange([...ranked.map((d) => d._id), dest._id]);
  }

  function removeFromRanked(dest) {
    onRankingChange(ranked.filter((d) => d._id !== dest._id).map((d) => d._id));
  }

  return (
    <div>
      {ranked.length > 0 && (
        <div className="mb-3">
          <h3 className="h6 text-muted">Your ranking (1st = highest points)</h3>
          <ol className="list-group list-group-numbered">
            {ranked.map((d, i) => (
              <li
                key={d._id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{d.name}</span>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-sm btn-outline-secondary py-0"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary py-0"
                    onClick={() => moveDown(i)}
                    disabled={i === ranked.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger py-0"
                    onClick={() => removeFromRanked(d)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      {unranked.length > 0 && (
        <div>
          <h3 className="h6 text-muted">Unranked (won't count)</h3>
          <ul className="list-group">
            {unranked.map((d) => (
              <li
                key={d._id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{d.name}</span>
                <button
                  className="btn btn-sm btn-outline-primary py-0"
                  onClick={() => addToRanked(d)}
                >
                  Add to ranking
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
