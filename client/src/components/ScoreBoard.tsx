import type { ScoredDestination } from '@tripcrew/shared';

interface ScoreBoardProps {
    scores: ScoredDestination[];
}

// scores: sorted desc by the API.
export default function ScoreBoard({ scores }: ScoreBoardProps) {
    const max = scores.reduce((m, s) => Math.max(m, s.score), 0);
    return (
        <div className="space-y-3">
            {scores.length === 0 && <p className="text-sm text-muted-foreground">No scores yet.</p>}
            {scores.map((s) => (
                <div key={s.destId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{s.name}</span>
                        <span className="font-bold tabular-nums">{s.score}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: max > 0 ? `${(s.score / max) * 100}%` : '0%' }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
