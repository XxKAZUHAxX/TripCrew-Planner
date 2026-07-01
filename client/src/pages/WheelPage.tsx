import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Destination, ScoredDestination, SpinResponse } from '@tripcrew/shared';
import { getWheelStatus, spinWheel } from '@/api/wheel.api';
import { getTrip } from '@/api/trips.api';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/errors';
import { refId } from '@/utils/refs';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import WheelCanvas from '@/components/WheelCanvas';
import WinnerBanner from '@/components/WinnerBanner';
import ChaosButton from '@/components/ChaosButton';

type Phase = 'idle' | 'spinning' | 'landed' | 'finalized';
type Winner = SpinResponse | Destination | string | null;

// Resolves the banner destination from whichever winner shape we currently hold.
function resolveWinner(winner: Winner, slices: ScoredDestination[]): { name: string } | undefined {
    if (winner && typeof winner === 'object' && 'name' in winner) {
        return winner;
    }
    if (winner && typeof winner === 'object' && 'winningDestinationId' in winner) {
        return slices.find((s) => s.destId === winner.winningDestinationId);
    }
    return undefined;
}

export default function WheelPage() {
    const { tripId } = useParams() as { tripId: string };
    const { user } = useAuth();
    const navigate = useNavigate();

    const [slices, setSlices] = useState<ScoredDestination[]>([]);
    const [eligible, setEligible] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [hostName, setHostName] = useState<string | undefined>();
    const [phase, setPhase] = useState<Phase>('idle');
    const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
    const [winner, setWinner] = useState<Winner>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStatus = useCallback(async () => {
        const [status, detail] = await Promise.all([getWheelStatus(tripId), getTrip(tripId)]);
        setSlices(status.slices || []);
        setEligible(status.eligible);
        const creatorId = refId(detail.trip.creator);
        setIsCreator(String(creatorId) === String(user?.id));
        const host = detail.members.find((m) => String(m._id) === String(creatorId));
        setHostName(host?.name);
        if (detail.trip.status !== 'voting') {
            setPhase((prev) => (prev === 'idle' ? 'finalized' : prev));
            setWinner((prev) => prev ?? detail.trip.winningDestination);
            return true;
        }
        return false;
    }, [tripId, user?.id]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                await loadStatus();
            } catch (err) {
                if (active) setError(getErrorMessage(err, 'Failed to load'));
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [loadStatus]);

    // Non-creators poll (Issue 11) so they see the result once the host spins.
    useEffect(() => {
        if (isCreator || phase === 'finalized') return;
        let active = true;
        const id = setInterval(async () => {
            try {
                const decided = await loadStatus();
                if (decided && active) clearInterval(id);
            } catch {
                /* transient — keep polling */
            }
        }, 10000);
        return () => {
            active = false;
            clearInterval(id);
        };
    }, [isCreator, phase, loadStatus]);

    async function handleRefresh() {
        setRefreshing(true);
        try {
            await loadStatus();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to refresh'));
        } finally {
            setRefreshing(false);
        }
    }

    // Server picks the winner first; we animate to the returned index.
    async function handleSpin() {
        setError(null);
        setPhase('spinning');
        try {
            const result = await spinWheel(tripId);
            setWinnerIndex(result.winnerIndex);
            setWinner(result);
        } catch (err) {
            setError(getErrorMessage(err, 'Spin failed'));
            setPhase('idle');
        }
    }

    function handleSpinEnd() {
        setPhase('landed');
        setTimeout(() => setPhase('finalized'), 800);
    }

    if (loading) return <PageLoader />;

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Wheel of Destiny</h1>
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

            <Card>
                <CardContent className="py-8">
                    {slices.length > 0 ? (
                        <WheelCanvas
                            slices={slices}
                            winnerIndex={winnerIndex}
                            spinning={phase === 'spinning'}
                            onSpinEnd={handleSpinEnd}
                        />
                    ) : (
                        <p className="text-center text-sm text-muted-foreground">
                            No destinations to show on the wheel yet.
                        </p>
                    )}

                    <ChaosButton
                        eligible={eligible}
                        isCreator={isCreator}
                        onSpin={handleSpin}
                        spinning={phase === 'spinning'}
                        hostName={hostName}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                    />

                    {phase === 'finalized' && winner && (
                        <WinnerBanner
                            destination={resolveWinner(winner, slices)}
                            onClose={() => navigate(`/trips/${tripId}/playbook`)}
                        />
                    )}

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        If the host does not spin within 12 hours of the deadline, the wheel will
                        spin automatically.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
