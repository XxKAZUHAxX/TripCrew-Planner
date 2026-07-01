import { useEffect, useState } from 'react';
import { CalendarClock, TimerReset, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FORTY_EIGHT_HOURS_MS, formatCountdown, formatDeadline, msUntil } from '@/utils/deadline';

interface DeadlineBadgeProps {
    /** ISO deadline string, or null if none set. */
    deadline: string | null | undefined;
    className?: string;
}

/**
 * Displays the voting deadline with four states (Issue 3):
 *  - none set  -> "No voting deadline set."
 *  - > 48h     -> "Voting closes: <date>"
 *  - < 48h     -> live "Closes in 23h 41m"
 *  - passed    -> "Voting deadline has passed."
 */
export default function DeadlineBadge({ deadline, className }: DeadlineBadgeProps) {
    const [now, setNow] = useState(() => Date.now());

    const remaining = msUntil(deadline, now);
    const showCountdown = remaining !== null && remaining > 0 && remaining <= FORTY_EIGHT_HOURS_MS;

    // Tick every second only while a live countdown is on screen.
    useEffect(() => {
        if (!showCountdown) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [showCountdown]);

    if (!deadline) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
                    className
                )}
            >
                <CalendarClock className="size-4" />
                No voting deadline set.
            </span>
        );
    }

    if (remaining !== null && remaining <= 0) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 text-sm font-medium text-destructive',
                    className
                )}
            >
                <AlertTriangle className="size-4" />
                Voting deadline has passed.
            </span>
        );
    }

    if (showCountdown && remaining !== null) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 text-sm font-medium text-warning-foreground',
                    className
                )}
            >
                <TimerReset className="size-4" />
                Closes in {formatCountdown(remaining)}
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
                className
            )}
        >
            <CalendarClock className="size-4" />
            Voting closes: {formatDeadline(deadline)}
        </span>
    );
}
