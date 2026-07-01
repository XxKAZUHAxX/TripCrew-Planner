import type { MonthCell } from '@/utils/dateKeys';
import { countToColor } from '@/utils/colorScale';
import { cn } from '@/lib/utils';

interface DateCellProps {
    cell: MonthCell | null;
    count: number;
    selected: boolean;
    onPointerDown: (key: string) => void;
    onPointerEnter: (key: string) => void;
}

export default function DateCell({
    cell,
    count,
    selected,
    onPointerDown,
    onPointerEnter,
}: DateCellProps) {
    if (!cell) {
        return <div aria-hidden className="aspect-square" />;
    }

    const bg = countToColor(count || 0);

    return (
        <button
            type="button"
            className={cn(
                'flex aspect-square touch-none select-none items-center justify-center rounded-md border text-xs transition',
                selected ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-border'
            )}
            style={{ backgroundColor: bg, color: count >= 3 ? '#fff' : undefined }}
            onPointerDown={(e) => {
                // Prevent scroll/text-selection interfering with touch drag-select.
                e.preventDefault();
                onPointerDown(cell.key);
            }}
            onPointerEnter={() => onPointerEnter(cell.key)}
            title={`${cell.key} · ${count || 0} available`}
            aria-pressed={selected}
        >
            {cell.day}
        </button>
    );
}
