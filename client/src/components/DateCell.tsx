import type { MonthCell } from '../utils/dateKeys';
import { countToColor } from '../utils/colorScale';

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
        return <div className="heatmap-cell is-blank" aria-hidden="true" />;
    }

    const bg = countToColor(count || 0);
    const border = selected ? '2px solid #0d6efd' : '1px solid #dee2e6';

    return (
        <div
            className="heatmap-cell"
            style={{ backgroundColor: bg, border, color: count >= 3 ? '#fff' : '#333' }}
            onMouseDown={() => onMouseDown(cell.key)}
            onMouseEnter={() => onMouseEnter(cell.key)}
            title={`${cell.key} · ${count || 0} available`}
            role="button"
            aria-pressed={selected}
        >
            {cell.day}
        </div>
    );
}
