import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <div className="space-y-4">
            {ranked.length > 0 && (
                <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                        Your ranking (1st = highest points)
                    </h3>
                    <ol className="space-y-2">
                        {ranked.map((d, i) => (
                            <li
                                key={d._id}
                                className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
                            >
                                <span className="flex items-center gap-2 font-medium">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {i + 1}
                                    </span>
                                    {d.name}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        onClick={() => moveUp(i)}
                                        disabled={i === 0}
                                        aria-label="Move up"
                                    >
                                        <ChevronUp className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        onClick={() => moveDown(i)}
                                        disabled={i === ranked.length - 1}
                                        aria-label="Move down"
                                    >
                                        <ChevronDown className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeFromRanked(d)}
                                        aria-label="Remove"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
            {unranked.length > 0 && (
                <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                        Unranked (won&apos;t count)
                    </h3>
                    <ul className="space-y-2">
                        {unranked.map((d) => (
                            <li
                                key={d._id}
                                className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
                            >
                                <span>{d.name}</span>
                                <Button variant="outline" size="sm" onClick={() => addToRanked(d)}>
                                    Add to ranking
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
