import { Trophy, Crown } from 'lucide-react';
import type { ScoredDestination, TripStatus } from '@tripcrew/shared';
import { cn } from '@/lib/utils';

interface ScoreBoardProps {
    scores: ScoredDestination[];
    /** When 'decided', the winning destination is crowned. */
    status?: TripStatus;
    /** The decided winner's id (falls back to the top score when omitted). */
    winningDestId?: string;
}

// Highlights the leader; calls out ties; crowns the winner once decided (Issue 13).
export default function ScoreBoard({ scores, status, winningDestId }: ScoreBoardProps) {
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const max = sorted.reduce((m, s) => Math.max(m, s.score), 0);
    const topScore = sorted.length > 0 ? sorted[0]!.score : 0;
    const leaders = sorted.filter((s) => s.score === topScore && topScore > 0);
    const isTie = leaders.length > 1;
    const decided = status === 'decided';
    const winnerId = winningDestId ?? (sorted.length > 0 ? sorted[0]!.destId : undefined);

    return (
        <div className="space-y-3">
            {sorted.length === 0 && <p className="text-sm text-muted-foreground">No scores yet.</p>}
            {isTie && !decided && (
                <p className="rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1.5 text-xs font-medium text-warning-foreground">
                    Tied — Wheel of Destiny may be needed.
                </p>
            )}
            {sorted.map((s) => {
                const isWinner = decided && s.destId === winnerId;
                const isLeader = !decided && s.score === topScore && topScore > 0;
                const highlight = isWinner
                    ? 'border-success/40 bg-success/10'
                    : isLeader && !isTie
                      ? 'border-warning/50 bg-warning/10'
                      : isLeader && isTie
                        ? 'border-warning/40 bg-warning/5'
                        : 'border-transparent';
                return (
                    <div
                        key={s.destId}
                        className={cn('space-y-1 rounded-lg border px-2.5 py-2', highlight)}
                    >
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 font-medium">
                                {isWinner ? (
                                    <Crown className="size-4 text-success" />
                                ) : isLeader && !isTie ? (
                                    <Trophy className="size-4 text-warning-foreground" />
                                ) : null}
                                {s.name}
                                {isWinner && (
                                    <span className="text-xs font-semibold text-success">
                                        Winner
                                    </span>
                                )}
                            </span>
                            <span className="font-bold tabular-nums">{s.score}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all',
                                    isWinner ? 'bg-success' : 'bg-primary'
                                )}
                                style={{ width: max > 0 ? `${(s.score / max) * 100}%` : '0%' }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
