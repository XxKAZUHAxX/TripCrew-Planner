import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import type { Destination, ScoredDestination } from '@tripcrew/shared';
import { getMyVote, submitVote, getTally } from '@/api/votes.api';
import { listDestinations } from '@/api/destinations.api';
import { getErrorMessage } from '@/utils/errors';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import RankableList from '@/components/RankableList';
import ScoreBoard from '@/components/ScoreBoard';

export default function VotePage() {
    const { tripId } = useParams() as { tripId: string };
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [rankedIds, setRankedIds] = useState<string[]>([]);
    const [scores, setScores] = useState<ScoredDestination[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const [dests, myVote, tally] = await Promise.all([
                    listDestinations(tripId),
                    getMyVote(tripId),
                    getTally(tripId),
                ]);
                if (!active) return;
                setDestinations(dests);
                setRankedIds(myVote?.ranking || []);
                setScores(tally);
            } catch (err) {
                if (active) setError(getErrorMessage(err, 'Failed to load'));
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => {
            active = false;
        };
    }, [tripId]);

    const destMap: Record<string, Destination> = Object.fromEntries(
        destinations.map((d) => [d._id, d])
    );
    const ranked = rankedIds.map((id) => destMap[id]).filter((d): d is Destination => Boolean(d));
    const unranked = destinations.filter((d) => !rankedIds.includes(d._id));

    async function handleSave() {
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            await submitVote(tripId, rankedIds);
            setScores(await getTally(tripId));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to save vote'));
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <PageLoader />;

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-5 flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Cast your vote</h1>
                <Link
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    to={`/trips/${tripId}`}
                >
                    <ArrowLeft className="size-4" />
                    Back
                </Link>
            </div>
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div>
                    {destinations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No destinations to rank yet.
                        </p>
                    ) : (
                        <RankableList
                            ranked={ranked}
                            unranked={unranked}
                            onRankingChange={setRankedIds}
                        />
                    )}
                    <div className="mt-4 flex items-center gap-3">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving…' : 'Save vote'}
                        </Button>
                        {saved && (
                            <span className="flex items-center gap-1 text-sm text-success">
                                <Check className="size-4" />
                                Vote saved!
                            </span>
                        )}
                    </div>
                </div>
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-base">Live scores (Borda count)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScoreBoard scores={scores} />
                        <p className="mt-3 text-xs text-muted-foreground">
                            Scores update after you save. Others’ scores reflect their saved votes.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
