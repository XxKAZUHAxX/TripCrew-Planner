import { Button } from '@/components/ui/button';

interface ChaosButtonProps {
    eligible: boolean;
    isCreator: boolean;
    onSpin: () => void;
    spinning: boolean;
}

// The Chaos Button — only visible/interactive for the trip creator when deadlock is eligible.
export default function ChaosButton({ eligible, isCreator, onSpin, spinning }: ChaosButtonProps) {
    if (!isCreator) return null;
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
                    The wheel unlocks when there is a tied score or the deadline passes with low
                    turnout.
                </p>
            )}
        </div>
    );
}
