// Drag-to-rank list — no external library needed; pure React state.
export interface RankableItem {
    _id: string;
    name: string;
}

interface RankableListProps {
    ranked: RankableItem[];
    unranked: RankableItem[];
    onRankingChange: (orderedIds: string[]) => void;
}

export default function RankableList({ ranked, unranked, onRankingChange }: RankableListProps) {
    function moveUp(index: number) {
        if (index === 0) return;
        const next = [...ranked];
        const prev = next[index - 1]!;
        const curr = next[index]!;
        next[index - 1] = curr;
        next[index] = prev;
        onRankingChange(next.map((d) => d._id));
    }

    function moveDown(index: number) {
        if (index === ranked.length - 1) return;
        const next = [...ranked];
        const curr = next[index]!;
        const after = next[index + 1]!;
        next[index] = after;
        next[index + 1] = curr;
        onRankingChange(next.map((d) => d._id));
    }

    function addToRanked(dest: RankableItem) {
        onRankingChange([...ranked.map((d) => d._id), dest._id]);
    }

    function removeFromRanked(dest: RankableItem) {
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
                    <h3 className="h6 text-muted">Unranked (won&apos;t count)</h3>
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
