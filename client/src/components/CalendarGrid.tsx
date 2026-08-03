import type { AvailabilityMember, Heatmap } from '@tripcrew/shared';
import { buildMonthCells, MONTH_NAMES, WEEKDAY_LABELS } from '@/utils/dateKeys';
import DateCell from './DateCell';
import Legend from './Legend';

interface CalendarGridProps {
    year: number;
    monthIndex: number;
    heatmap: Heatmap;
    myDates: Set<string>;
    totalMembers?: number;
    /** Map of date key → members available on that date, for per-cell indicators. */
    membersByDate?: Record<string, AvailabilityMember[]>;
    onPointerDown: (key: string) => void;
    onPointerEnter: (key: string) => void;
}

export default function CalendarGrid({
    year,
    monthIndex,
    heatmap,
    myDates,
    totalMembers,
    membersByDate,
    onPointerDown,
    onPointerEnter,
}: CalendarGridProps) {
    const cells = buildMonthCells(year, monthIndex);

    return (
        <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {MONTH_NAMES[monthIndex]} {year}
            </h3>
            <div className="grid touch-none select-none grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((d) => (
                    <div
                        key={d}
                        className="text-center text-xs font-semibold text-muted-foreground"
                    >
                        {d}
                    </div>
                ))}
                {cells.map((cell, i) => (
                    <DateCell
                        key={cell ? cell.key : `blank-${i}`}
                        cell={cell}
                        count={cell ? heatmap[cell.key] || 0 : 0}
                        selected={cell ? myDates.has(cell.key) : false}
                        members={cell ? membersByDate?.[cell.key] : undefined}
                        onPointerDown={onPointerDown}
                        onPointerEnter={onPointerEnter}
                    />
                ))}
            </div>
            <Legend totalMembers={totalMembers} />
        </div>
    );
}
