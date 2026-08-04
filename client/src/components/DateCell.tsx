import { useState } from 'react';
import type { AvailabilityMember } from '@tripcrew/shared';
import type { MonthCell } from '@/utils/dateKeys';
import { countToColor, isDarkShade } from '@/utils/colorScale';
import { cn } from '@/lib/utils';

interface DateCellProps {
    cell: MonthCell | null;
    count: number;
    selected: boolean;
    /** Total trip members, used to scale the gradient color by proportion. */
    totalMembers?: number;
    /** Members available on this date (drives the who's-available indicator). */
    members?: AvailabilityMember[];
    /**
     * 'set' = tap/drag toggles the user's availability (default).
     * 'navigate' = tap only reveals who's available; no voting happens.
     */
    mode?: 'set' | 'navigate';
    onPointerDown: (key: string) => void;
    onPointerEnter: (key: string) => void;
}

export default function DateCell({
    cell,
    count,
    selected,
    totalMembers,
    members = [],
    mode = 'set',
    onPointerDown,
    onPointerEnter,
}: DateCellProps) {
    // Local toggle so touch users can reveal the list without toggling the date.
    const [open, setOpen] = useState(false);

    if (!cell) {
        return <div aria-hidden className="aspect-square" />;
    }

    const bg = countToColor(count || 0, totalMembers);
    const hasMembers = members.length > 0;
    const isNavigate = mode === 'navigate';

    return (
        <div className="group/cell relative">
            <button
                type="button"
                className={cn(
                    'flex aspect-square w-full touch-none select-none flex-col items-center justify-center rounded-md border text-xs transition',
                    selected ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-border'
                )}
                style={{
                    backgroundColor: bg,
                    color: isDarkShade(count, totalMembers) ? '#fff' : undefined,
                }}
                onPointerDown={(e) => {
                    // Prevent scroll/text-selection interfering with touch drag-select.
                    e.preventDefault();
                    if (isNavigate) {
                        setOpen((v) => !v);
                        return;
                    }
                    onPointerDown(cell.key);
                }}
                onPointerEnter={() => {
                    if (isNavigate) return;
                    onPointerEnter(cell.key);
                }}
                onBlur={() => {
                    if (isNavigate) setOpen(false);
                }}
                aria-pressed={isNavigate ? undefined : selected}
            >
                <span className="leading-none">{cell.day}</span>
            </button>
            {!isNavigate && hasMembers && (
                <>
                    {/* Corner toggle: reveals the member list on tap/click without
                        triggering the drag-select on the underlying date button.
                        Only needed in 'set' mode — in 'navigate' mode the whole
                        cell already opens this panel. */}
                    <button
                        type="button"
                        aria-label={`Show who's available on ${cell.key}`}
                        aria-expanded={open}
                        className="absolute -right-1 -top-1 z-10 flex size-3.5 items-center justify-center rounded-full border border-border bg-background text-[0.55rem] font-bold leading-none text-foreground shadow-sm"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen((v) => !v);
                        }}
                        onBlur={() => setOpen(false)}
                    >
                        {members.length}
                    </button>
                    <div
                        role="tooltip"
                        className={cn(
                            'absolute bottom-full left-1/2 z-50 mb-1 w-max max-w-[11rem] -translate-x-1/2',
                            'rounded-md border border-border bg-popover px-2 py-1.5 text-left',
                            'text-[0.7rem] leading-tight text-popover-foreground shadow-md',
                            open
                                ? 'block'
                                : 'hidden group-hover/cell:block group-focus-within/cell:block'
                        )}
                    >
                        <p className="mb-0.5 font-semibold">{members.length} available</p>
                        <ul className="space-y-0.5">
                            {members.map((m) => (
                                <li key={m.id}>{m.name}</li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
            {isNavigate && (
                <div
                    role="tooltip"
                    className={cn(
                        'absolute bottom-full left-1/2 z-50 mb-1 w-max max-w-[11rem] -translate-x-1/2',
                        'rounded-md border border-border bg-popover px-2 py-1.5 text-left',
                        'text-[0.7rem] leading-tight text-popover-foreground shadow-md',
                        open ? 'block' : 'hidden'
                    )}
                >
                    <p className="mb-0.5 font-semibold">{members.length} available</p>
                    {hasMembers ? (
                        <ul className="space-y-0.5">
                            {members.map((m) => (
                                <li key={m.id}>{m.name}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic text-muted-foreground">No one yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}
