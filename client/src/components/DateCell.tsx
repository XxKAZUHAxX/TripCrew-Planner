import type { MonthCell } from '@/utils/dateKeys';
import { countToColor } from '@/utils/colorScale';
import { cn } from '@/lib/utils';

interface DateCellProps {
    cell: MonthCell | null;
    count: number;
    selected: boolean;
    onMouseDown: (key: string) => void;
    onMouseEnter: (key: string) => void;
}

export default function DateCell({
    cell,
    count,
    selected,
    onMouseDown,
    onMouseEnter,
}: DateCellProps) {
    if (!cell) {
        return <div aria-hidden className="aspect-square" />;
    }

    const bg = countToColor(count || 0);

    return (
        <button
            type="button"
            className={cn(
                'flex aspect-square select-none items-center justify-center rounded-md border text-xs transition',
                selected ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-border'
            )}
            style={{ backgroundColor: bg, color: count >= 3 ? '#fff' : undefined }}
            onMouseDown={() => onMouseDown(cell.key)}
            onMouseEnter={() => onMouseEnter(cell.key)}
            title={`${cell.key} · ${count || 0} available`}
            aria-pressed={selected}
        >
            {cell.day}
        </button>
    );
}
