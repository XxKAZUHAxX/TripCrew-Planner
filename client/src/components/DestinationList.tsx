import { useState, type FormEvent } from 'react';
import type { BudgetTier, Destination, ProposeDestinationRequest } from '@tripcrew/shared';
import DestinationCard from './DestinationCard';
import { refId } from '../utils/refs';

const TIERS: BudgetTier[] = ['low', 'medium', 'high'];

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
        <div>
            <form onSubmit={handleSubmit} className="card p-3 mb-3 shadow-sm">
                <h2 className="h6">Propose a destination</h2>
                <div className="mb-2">
                    <input
                        className="form-control"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-2">
                    <input
                        className="form-control"
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="mb-2">
                    <select
                        className="form-select"
                        value={budgetTier}
                        onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
                    >
                        {TIERS.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
                <button className="btn btn-outline-primary">Add</button>
            </form>

            {destinations.length === 0 && (
                <p className="text-muted">No destinations proposed yet.</p>
            )}
            {destinations.map((d) => {
                const proposerId = refId(d.proposedBy);
                const canDelete = proposerId === currentUserId || creatorId === currentUserId;
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
    );
}
