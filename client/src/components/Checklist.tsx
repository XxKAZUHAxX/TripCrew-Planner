import { useState, type FormEvent } from 'react';
import type { ChecklistItem } from '@tripcrew/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        <div className="space-y-3">
            <h3 className="text-sm font-semibold">Checklist</h3>
            {checklist.length === 0 && (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
            )}
            <ul className="space-y-2">
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
            <form onSubmit={handleAdd} className="flex gap-2">
                <Input
                    placeholder="Add task…"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                />
                <Button type="submit" variant="outline">
                    Add
                </Button>
            </form>
        </div>
    );
}
