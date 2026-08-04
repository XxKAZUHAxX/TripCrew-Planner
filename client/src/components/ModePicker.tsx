import { useState, useEffect, useCallback } from 'react';
import { Eye, Vote, ChevronRight, ArrowLeft, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type InteractionMode = 'set' | 'navigate';

interface ModeOption {
    mode: InteractionMode;
    label: string;
    subtitle: string;
    icon: typeof Eye;
}

const OPTIONS: ModeOption[] = [
    {
        mode: 'navigate',
        label: 'Viewing',
        subtitle: 'Read-only',
        icon: Eye,
    },
    {
        mode: 'set',
        label: 'Voting',
        subtitle: 'Cast your vote',
        icon: Vote,
    },
];

function optionForMode(mode: InteractionMode): ModeOption {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return OPTIONS.find((o) => o.mode === mode)!;
}

interface ModePickerProps {
    /** Current interaction mode ('set' = voting, 'navigate' = viewing). */
    mode: InteractionMode;
    onModeChange: (mode: InteractionMode) => void;
    disabled?: boolean;
}

export default function ModePicker({ mode, onModeChange, disabled }: ModePickerProps) {
    const [open, setOpen] = useState(false);
    const current = optionForMode(mode);
    const Icon = current.icon;

    const handleSelect = useCallback(
        (next: InteractionMode) => {
            onModeChange(next);
            setOpen(false);
        },
        [onModeChange],
    );

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <>
            {/* Collapsed row */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(true)}
                className={cn(
                    'flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3',
                    'text-left transition hover:bg-accent',
                    disabled && 'cursor-not-allowed opacity-50',
                )}
            >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">Mode</span>
                <span className="ml-auto text-sm text-muted-foreground">
                    {current.label}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>

            {/* Expanded modal */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:items-center sm:pt-0 sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Select mode"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setOpen(false)}
                    />

                    {/* Sheet */}
                    <div
                        className={cn(
                            'relative z-10 w-full max-w-md rounded-xl border border-border bg-card shadow-lg',
                            'animate-in fade-in-0 zoom-in-95',
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
                            >
                                <ArrowLeft className="size-4" />
                                <span>Back</span>
                            </button>
                            <h2 className="text-sm font-semibold">Mode</h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition"
                                aria-label="Close"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Options list */}
                        <div className="py-2">
                            {OPTIONS.map((opt) => {
                                const OptIcon = opt.icon;
                                const isSelected = opt.mode === mode;
                                return (
                                    <button
                                        key={opt.mode}
                                        type="button"
                                        onClick={() => handleSelect(opt.mode)}
                                        className={cn(
                                            'flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent',
                                        )}
                                    >
                                        <OptIcon className="size-5 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold">
                                                {opt.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {opt.subtitle}
                                            </p>
                                        </div>
                                        <span className="ml-auto flex size-5 shrink-0 items-center justify-center">
                                            {isSelected && (
                                                <Check className="size-4 text-primary" />
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
