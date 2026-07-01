import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type {
    BudgetTier,
    Destination,
    ProposeDestinationRequest,
    TripStatus,
} from '@tripcrew/shared';
import { refId } from '@/utils/refs';
import { cn } from '@/lib/utils';
import { budgetOptionLabel } from '@/utils/budget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/tooltip';
import DestinationCard from './DestinationCard';

const TIERS: BudgetTier[] = ['low', 'medium', 'high'];

const selectClass = cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-50'
);

interface DestinationListProps {
    destinations: Destination[];
    currentUserId: string | undefined;
    creatorId: string | undefined;
    /** Trip status; proposals are only allowed while 'voting' (Issue 6). */
    status?: TripStatus;
    onPropose: (payload: ProposeDestinationRequest) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
}

export default function DestinationList({
    destinations,
    currentUserId,
    creatorId,
    status = 'voting',
    onPropose,
    onDelete,
}: DestinationListProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [budgetTier, setBudgetTier] = useState<BudgetTier>('medium');
    const [submitting, setSubmitting] = useState(false);

    const proposalsOpen = status === 'voting';

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!proposalsOpen) return;
        setSubmitting(true);
        try {
            await onPropose({ name, description, budgetTier });
            setName('');
            setDescription('');
            setBudgetTier('medium');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-4">
            <Card className={cn(!proposalsOpen && 'opacity-60')}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Propose a destination</CardTitle>
                </CardHeader>
                <CardContent>
                    {!proposalsOpen && (
                        <p className="mb-3 text-sm text-muted-foreground">
                            Destination proposals are closed.
                        </p>
                    )}
                    <fieldset disabled={!proposalsOpen} className="min-w-0">
                        <form onSubmit={handleSubmit} className="space-y-2">
                            <Input
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <Input
                                placeholder="Description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <div className="space-y-1">
                                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    Budget
                                    <InfoTooltip content="Estimated cost per person for the whole trip." />
                                </span>
                                <select
                                    className={selectClass}
                                    value={budgetTier}
                                    onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
                                >
                                    {TIERS.map((t) => (
                                        <option key={t} value={t}>
                                            {budgetOptionLabel(t)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full"
                                disabled={submitting || !proposalsOpen}
                            >
                                <Plus className="size-4" />
                                {submitting ? 'Adding…' : 'Add destination'}
                            </Button>
                        </form>
                    </fieldset>
                </CardContent>
            </Card>

            {destinations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No destinations proposed yet.</p>
            ) : (
                <div className="space-y-2">
                    {destinations.map((d) => {
                        const proposerId = refId(d.proposedBy);
                        const canDelete =
                            proposerId === currentUserId || creatorId === currentUserId;
                        return (
                            <DestinationCard
                                key={d._id}
                                destination={d}
                                canDelete={canDelete}
                                onDelete={onDelete}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
