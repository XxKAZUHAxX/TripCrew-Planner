import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
    return (
        <Loader2
            className={cn('size-5 animate-spin text-muted-foreground', className)}
            aria-hidden
        />
    );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
            <p className="text-sm">{label}</p>
        </div>
    );
}
