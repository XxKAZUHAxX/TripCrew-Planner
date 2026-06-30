import { Trash2 } from 'lucide-react';
import type { BudgetTier, Destination } from '@tripcrew/shared';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const TIER_VARIANT: Record<BudgetTier, BadgeProps['variant']> = {
    low: 'success',
    medium: 'warning',
    high: 'destructive',
};

interface DestinationCardProps {
    destination: Destination;
    canDelete: boolean;
    onDelete: (id: string) => void;
}

export default function DestinationCard({
    destination,
    canDelete,
    onDelete,
}: DestinationCardProps) {
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
                    <Badge
                        variant={TIER_VARIANT[destination.budgetTier] || 'secondary'}
                        className="mt-2 capitalize"
                    >
                        {destination.budgetTier}
                    </Badge>
                </div>
                {canDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(destination._id)}
                        aria-label="Remove destination"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
