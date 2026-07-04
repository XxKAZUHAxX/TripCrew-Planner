/** Formats a destination's freeform estimated cost (Feature 7). */

/** e.g. "₱1,500" or "No estimate yet" when null/blank. */
export function formatCost(estimatedCost: number | null | undefined): string {
    if (estimatedCost == null) return 'No estimate yet';
    return `₱${estimatedCost.toLocaleString('en-PH')}`;
}
