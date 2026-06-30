// UTC date-key helpers. All availability keys are YYYY-MM-DD in UTC.

export interface MonthCell {
    key: string;
    day: number;
}

export function toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function fromDateKey(key: string): Date {
    return new Date(`${key}T00:00:00.000Z`);
}

// Returns an array of { key, day } cells for a given UTC month, padded with
// nulls so the 1st lands under the correct weekday column (0 = Sunday).
export function buildMonthCells(year: number, monthIndex: number): Array<MonthCell | null> {
    const first = new Date(Date.UTC(year, monthIndex, 1));
    const startWeekday = first.getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const cells: Array<MonthCell | null> = [];
    for (let i = 0; i < startWeekday; i++) {
        cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(Date.UTC(year, monthIndex, day));
        cells.push({ key: toDateKey(d), day });
    }
    return cells;
}

export const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
