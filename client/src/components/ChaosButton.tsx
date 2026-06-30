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
        <div className="text-center my-4">
            <button
                className="btn btn-warning btn-lg fw-bold"
                disabled={!eligible || spinning}
                onClick={onSpin}
                title={!eligible ? 'No deadlock detected yet' : ''}
            >
                {spinning ? '🌀 Spinning…' : '🎡 Spin the Wheel of Destiny'}
            </button>
            {!eligible && (
                <p className="text-muted small mt-2">
                    The wheel unlocks when there is a tied score or the deadline passes with low
                    turnout.
                </p>
            )}
        </div>
    );
}
