import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { BudgetTier, Destination } from '@tripcrew/shared';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BUDGET_META, budgetBadgeLabel } from '@/utils/budget';

const TIER_VARIANT: Record<BudgetTier, BadgeProps['variant']> = {
    low: 'success',
    medium: 'warning',
    high: 'destructive',
};

interface DestinationCardProps {
    destination: Destination;
    canDelete: boolean;
    onDelete: (id: string) => void | Promise<void>;
}

export default function DestinationCard({
    destination,
    canDelete,
    onDelete,
}: DestinationCardProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const tier = destination.budgetTier;

    return (
        <div className="rounded-lg border bg-card p-3 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="font-medium">{destination.name}</h3>
                    {destination.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {destination.description}
                        </p>
                    )}
                    <Tooltip content={`${BUDGET_META[tier].label}: ${BUDGET_META[tier].range}`}>
                        <Badge
                            variant={TIER_VARIANT[tier] || 'secondary'}
                            className="mt-2 cursor-help"
                        >
                            {budgetBadgeLabel(tier)}
                        </Badge>
                    </Tooltip>
                </div>
                {canDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmOpen(true)}
                        aria-label="Remove destination"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Remove destination"
                description={`Remove ${destination.name} from the list? This cannot be undone.`}
                confirmLabel="Remove"
                onConfirm={() => onDelete(destination._id)}
            />
        </div>
    );
}
