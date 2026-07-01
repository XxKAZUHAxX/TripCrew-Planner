/** Formatting helpers for the voting deadline display (Issue 3). */

/** e.g. "Jul 15, 2026 at 11:59 PM". Returns null for an invalid date. */
export function formatDeadline(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const datePart = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
    const timePart = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    }).format(d);
    return `${datePart} at ${timePart}`;
}

/** Whether the deadline is in the past relative to `now`. */
export function isPast(iso: string | null | undefined, now: number = Date.now()): boolean {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return !Number.isNaN(t) && now >= t;
}

/** Milliseconds remaining until the deadline (negative if past), or null. */
export function msUntil(iso: string | null | undefined, now: number = Date.now()): number | null {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    return t - now;
}

/** e.g. "23h 41m" or "5m 12s". For the < 48h live countdown. */
export function formatCountdown(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

export const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
