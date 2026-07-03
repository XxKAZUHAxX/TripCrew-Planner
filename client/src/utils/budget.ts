import type { BudgetTier } from '@tripcrew/shared';

interface BudgetMeta {
    /** Plain label, e.g. "Medium". */
    label: string;
    /** Human price range. */
    range: string;
}

export const BUDGET_META: Record<BudgetTier, BudgetMeta> = {
    low: { label: 'Low', range: 'under ₱1,000' },
    medium: { label: 'Medium', range: '₱1,000–₱5,000' },
    high: { label: 'High', range: '₱5,000+' },
};

/** e.g. "Medium (₱1,000–₱5,000)" */
export function budgetOptionLabel(tier: BudgetTier): string {
    const m = BUDGET_META[tier];
    return `${m.label} (${m.range})`;
}

/** e.g. "Medium" */
export function budgetBadgeLabel(tier: BudgetTier): string {
    const m = BUDGET_META[tier];
    return `${m.label}`;
}
