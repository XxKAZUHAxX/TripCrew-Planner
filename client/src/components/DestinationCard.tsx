import type { BudgetTier, Destination } from '@tripcrew/shared';

const TIER_COLORS: Record<BudgetTier, string> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
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
        <div className="card mb-2">
            <div className="card-body py-2">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h3 className="h6 mb-1">{destination.name}</h3>
                        {destination.description && (
                            <p className="text-muted small mb-1">{destination.description}</p>
                        )}
                        <span
                            className={`badge bg-${TIER_COLORS[destination.budgetTier] || 'secondary'}`}
                        >
                            {destination.budgetTier}
                        </span>
                    </div>
                    {canDelete && (
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onDelete(destination._id)}
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
