import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import type { Destination, ScoredDestination, TripStatus } from '@tripcrew/shared';
import { getMyVote, submitVote, getTally } from '@/api/votes.api';
import { listDestinations } from '@/api/destinations.api';
import { getTrip } from '@/api/trips.api';
import { getErrorMessage } from '@/utils/errors';
import { refId } from '@/utils/refs';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InfoTooltip } from '@/components/ui/tooltip';
import RankableList from '@/components/RankableList';
import ScoreBoard from '@/components/ScoreBoard';
import DeadlineBadge from '@/components/DeadlineBadge';

export default function VotePage() {
    const { tripId } = useParams() as { tripId: string };
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [rankedIds, setRankedIds] = useState<string[]>([]);
    const [scores, setScores] = useState<ScoredDestination[]>([]);
    const [status, setStatus] = useState<TripStatus>('voting');
    const [votingDeadline, setVotingDeadline] = useState<string | null>(null);
    const [winningDestId, setWinningDestId] = useState<string | undefined>();
    const [hasExistingVote, setHasExistingVote] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const [dests, myVote, tally, detail] = await Promise.all([
                    listDestinations(tripId),
                    getMyVote(tripId),
                    getTally(tripId),
                    getTrip(tripId),
                ]);
                if (!active) return;
                setDestinations(dests);
                setRankedIds(myVote?.ranking || []);
                setHasExistingVote(Boolean(myVote));
                setScores(tally);
                setStatus(detail.trip.status);
                setVotingDeadline(detail.trip.votingDeadline);
                setWinningDestId(refId(detail.trip.winningDestination));
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
    const isDecided = status === 'decided';

    async function saveVote() {
        setSaving(true);
        setError(null);
        try {
            await submitVote(tripId, rankedIds);
            setScores(await getTally(tripId));
            setHasExistingVote(true);
            toast.success('Vote saved!');
        } catch (err) {
            const message = getErrorMessage(err, 'Failed to save vote');
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    }

    function handleSaveClick() {
        if (unranked.length > 0) {
            setConfirmOpen(true);
            return;
        }
        void saveVote();
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

            <div className="mb-4">
                <DeadlineBadge deadline={votingDeadline} />
            </div>

            {isDecided && (
                <Alert variant="success" className="mb-4">
                    <AlertDescription className="flex flex-wrap items-center gap-2">
                        <Lock className="size-4" />
                        Voting has closed. The destination has been decided.
                        <Link
                            to={`/trips/${tripId}/playbook`}
                            className="font-medium underline underline-offset-2"
                        >
                            View the Playbook
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            {!isDecided && hasExistingVote && (
                <Alert className="mb-4">
                    <AlertDescription className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-success" />
                        You’ve already submitted a vote. You can update it below.
                    </AlertDescription>
                </Alert>
            )}

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
                            readOnly={isDecided}
                        />
                    )}
                    {!isDecided && (
                        <div className="mt-4">
                            <Button onClick={handleSaveClick} disabled={saving}>
                                {saving ? 'Saving…' : 'Save vote'}
                            </Button>
                        </div>
                    )}
                </div>
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-1.5 text-base">
                            Live scores (Ranked-choice score)
                            <InfoTooltip content="Points are assigned by ranking order — the higher you rank a destination, the more points it gets." />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScoreBoard scores={scores} status={status} winningDestId={winningDestId} />
                        <p className="mt-3 text-xs text-muted-foreground">
                            Scores update after you save. Others’ scores reflect their saved votes.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Save an incomplete vote?"
                description={`You have ${unranked.length} unranked destination${
                    unranked.length === 1 ? '' : 's'
                }. Unranked items receive no points and won’t influence the result. Save anyway?`}
                confirmLabel="Save anyway"
                confirmVariant="default"
                onConfirm={saveVote}
            />
        </div>
    );
}
