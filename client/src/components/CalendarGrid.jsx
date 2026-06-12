import { useEffect, useCallback } from 'react';
import DateCell from './DateCell.jsx';
import Legend from './Legend.jsx';
import { buildMonthCells, MONTH_NAMES, WEEKDAY_LABELS } from '../utils/dateKeys.js';

// heatmap: { 'YYYY-MM-DD': count }
// myDates: Set<string>
// onToggle: (key, mode) => void — called on mousedown (mode 'add'/'remove') and drag
export default function CalendarGrid({
  year,
  monthIndex,
  heatmap,
  myDates,
  dragState,
  onMouseDown,
  onMouseEnter,
}) {
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
