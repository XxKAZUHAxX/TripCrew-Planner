import { useState, useEffect } from 'react';
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
    const [phase, setPhase] = useState<Phase>('idle');
    const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
    const [winner, setWinner] = useState<Winner>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const [status, detail] = await Promise.all([
                    getWheelStatus(tripId),
                    getTrip(tripId),
                ]);
                if (!active) return;
                setSlices(status.slices || []);
                setEligible(status.eligible);
                const creatorId = refId(detail.trip.creator);
                setIsCreator(String(creatorId) === String(user?.id));
                if (detail.trip.status !== 'voting') {
                    setPhase('finalized');
                    setWinner(detail.trip.winningDestination);
                }
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
    }, [tripId, user?.id]);

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
                    />

                    {phase === 'finalized' && winner && (
                        <WinnerBanner
                            destination={resolveWinner(winner, slices)}
                            onClose={() => navigate(`/trips/${tripId}/playbook`)}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
