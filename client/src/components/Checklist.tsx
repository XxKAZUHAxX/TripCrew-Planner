import { useState, type FormEvent } from 'react';
import type { ChecklistItem } from '@tripcrew/shared';
import TaskRow from './TaskRow';

interface ChecklistProps {
    checklist: ChecklistItem[];
    currentUserId: string | undefined;
    creatorId: string | null | undefined;
    onToggle: (id: string) => void | Promise<void>;
    onAdd: (label: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
}

export default function Checklist({
    checklist,
    currentUserId,
    creatorId,
    onToggle,
    onAdd,
    onDelete,
}: ChecklistProps) {
    const [label, setLabel] = useState('');

    async function handleAdd(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!label.trim()) return;
        await onAdd(label.trim());
        setLabel('');
    }

    return (
        <div>
            <h3 className="h6 mt-3">Checklist</h3>
            {checklist.length === 0 && <p className="text-muted small">No tasks yet.</p>}
            <ul className="list-group mb-3">
                {checklist.map((t) => (
                    <TaskRow
                        key={t.id}
                        task={t}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        canDelete={
                            String(t.createdBy) === String(currentUserId) ||
                            String(creatorId) === String(currentUserId)
                        }
                    />
                ))}
            </ul>
            <form onSubmit={handleAdd} className="input-group input-group-sm">
                <input
                    className="form-control"
                    placeholder="Add task…"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                />
                <button className="btn btn-outline-primary">Add</button>
            </form>
        </div>
    );
}
