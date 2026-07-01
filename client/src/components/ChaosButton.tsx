import { Hourglass, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChaosButtonProps {
    eligible: boolean;
    isCreator: boolean;
    onSpin: () => void;
    spinning: boolean;
    /** Host's display name, shown to non-creators while waiting (Issue 11). */
    hostName?: string;
    /** Lets non-creators re-check whether the host has spun (Issue 11). */
    onRefresh?: () => void;
    refreshing?: boolean;
}

// The Chaos Button — creator spins; non-creators see a waiting state (Issue 11).
export default function ChaosButton({
    eligible,
    isCreator,
    onSpin,
    spinning,
    hostName,
    onRefresh,
    refreshing,
}: ChaosButtonProps) {
    if (!isCreator) {
        return (
            <div className="my-6 flex flex-col items-center gap-3 text-center">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hourglass className="size-4" />
                    Waiting for {hostName || 'the host'} to spin the Wheel of Destiny…
                </p>
                {onRefresh && (
                    <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
                        <RefreshCw className="size-4" />
                        {refreshing ? 'Checking…' : 'Refresh'}
                    </Button>
                )}
            </div>
        );
    }
    return (
        <div className="my-6 text-center">
            <Button
                variant="warning"
                size="lg"
                className="font-bold shadow-md"
                disabled={!eligible || spinning}
                onClick={onSpin}
                title={!eligible ? 'No deadlock detected yet' : ''}
            >
                {spinning ? '🌀 Spinning…' : '🎡 Spin the Wheel of Destiny'}
            </Button>
            {!eligible && (
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Available when votes are tied or not enough members have voted by the deadline.
                </p>
            )}
        </div>
    );
}
