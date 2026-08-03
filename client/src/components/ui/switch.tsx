import { cn } from '@/lib/utils';

interface SwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    /** Label rendered to the left of the track; emphasized when unchecked. */
    leftLabel?: string;
    /** Label rendered to the right of the track; emphasized when checked. */
    rightLabel?: string;
    id?: string;
    disabled?: boolean;
}

/**
 * A two-state pill switch, dependency-free (no Radix) to match the project's
 * hand-rolled UI kit (see ConfirmDialog).
 */
export function Switch({
    checked,
    onCheckedChange,
    leftLabel,
    rightLabel,
    id,
    disabled,
}: SwitchProps) {
    return (
        <div className="inline-flex items-center gap-2">
            {leftLabel && (
                <span
                    className={cn(
                        'text-sm font-medium',
                        !checked ? 'text-foreground' : 'text-muted-foreground'
                    )}
                >
                    {leftLabel}
                </span>
            )}
            <button
                type="button"
                id={id}
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onCheckedChange(!checked)}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors',
                    checked ? 'bg-primary' : 'bg-muted',
                    disabled && 'cursor-not-allowed opacity-50'
                )}
            >
                <span
                    className={cn(
                        'inline-block size-4 transform rounded-full bg-background shadow transition-transform',
                        checked ? 'translate-x-6' : 'translate-x-1'
                    )}
                />
            </button>
            {rightLabel && (
                <span
                    className={cn(
                        'text-sm font-medium',
                        checked ? 'text-foreground' : 'text-muted-foreground'
                    )}
                >
                    {rightLabel}
                </span>
            )}
        </div>
    );
}
