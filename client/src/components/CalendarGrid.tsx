import type { Heatmap } from '@tripcrew/shared';
import DateCell from './DateCell';
import Legend from './Legend';
import { buildMonthCells, MONTH_NAMES, WEEKDAY_LABELS } from '../utils/dateKeys';

interface CalendarGridProps {
    year: number;
    monthIndex: number;
    heatmap: Heatmap;
    myDates: Set<string>;
    onMouseDown: (key: string) => void;
    onMouseEnter: (key: string) => void;
}

export default function CalendarGrid({
    year,
    monthIndex,
    heatmap,
    myDates,
    onMouseDown,
    onMouseEnter,
}: CalendarGridProps) {
    const cells = buildMonthCells(year, monthIndex);

    return (
        <div className="mb-4">
            <h3 className="h6 text-muted mb-1">
                {MONTH_NAMES[monthIndex]} {year}
            </h3>
            <div className="heatmap-grid mb-1">
                {WEEKDAY_LABELS.map((d) => (
                    <div key={d} className="text-center small text-muted fw-semibold">
                        {d}
                    </div>
                ))}
                {cells.map((cell, i) => (
                    <DateCell
                        key={cell ? cell.key : `blank-${i}`}
                        cell={cell}
                        count={cell ? heatmap[cell.key] || 0 : 0}
                        selected={cell ? myDates.has(cell.key) : false}
                        onMouseDown={onMouseDown}
                        onMouseEnter={onMouseEnter}
                    />
                ))}
            </div>
            <Legend />
        </div>
    );
}
