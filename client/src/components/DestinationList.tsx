import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { BudgetTier, Destination, ProposeDestinationRequest } from '@tripcrew/shared';
import { refId } from '@/utils/refs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DestinationCard from './DestinationCard';

const TIERS: BudgetTier[] = ['low', 'medium', 'high'];

const selectClass = cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize shadow-sm',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
);

interface DestinationListProps {
    destinations: Destination[];
    currentUserId: string | undefined;
    creatorId: string | undefined;
    onPropose: (payload: ProposeDestinationRequest) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
}

export default function DestinationList({
    destinations,
    currentUserId,
    creatorId,
    onPropose,
    onDelete,
}: DestinationListProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [budgetTier, setBudgetTier] = useState<BudgetTier>('medium');

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        await onPropose({ name, description, budgetTier });
        setName('');
        setDescription('');
        setBudgetTier('medium');
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Propose a destination</CardTitle>
                </CardHeader>
                <CardContent>
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
                        <select
                            className={selectClass}
                            value={budgetTier}
                            onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
                        >
                            {TIERS.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <Button type="submit" variant="outline" className="w-full">
                            <Plus className="size-4" />
                            Add destination
                        </Button>
                    </form>
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
