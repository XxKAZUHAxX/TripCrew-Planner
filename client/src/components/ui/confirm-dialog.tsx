import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: React.ReactNode;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Visual variant of the confirm button. Defaults to 'destructive'. */
    confirmVariant?: ButtonProps['variant'];
    /** Invoked on confirm. May be async; the button shows a pending state. */
    onConfirm: () => void | Promise<void>;
}

/**
 * A focus-trapping confirmation dialog for destructive / consequential actions.
 * Dependency-free (no Radix) to match the project's hand-rolled UI kit.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'destructive',
    onConfirm,
}: ConfirmDialogProps) {
    const [pending, setPending] = React.useState(false);
    const confirmRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        if (!open) return;
        confirmRef.current?.focus();
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && !pending) onOpenChange(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, pending, onOpenChange]);

    if (!open) return null;

    async function handleConfirm() {
        try {
            setPending(true);
            await onConfirm();
            onOpenChange(false);
        } finally {
            setPending(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="alertdialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
        >
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => !pending && onOpenChange(false)}
            />
            <div
                className={cn(
                    'relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg',
                    'animate-in fade-in-0 zoom-in-95'
                )}
            >
                <h2 className="text-lg font-semibold">{title}</h2>
                <div className="mt-2 text-sm text-muted-foreground">{description}</div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={pending}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        ref={confirmRef}
                        variant={confirmVariant}
                        onClick={handleConfirm}
                        disabled={pending}
                    >
                        {pending ? 'Working…' : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
