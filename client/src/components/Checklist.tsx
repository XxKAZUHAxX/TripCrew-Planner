import { useState, type FormEvent } from 'react';
import type { ChecklistItem } from '@tripcrew/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import TaskRow from './TaskRow';

interface ChecklistProps {
    checklist: ChecklistItem[];
    currentUserId: string | undefined;
    creatorId: string | null | undefined;
    /** Total members, for completion counts and progress (Issue 4). */
    totalMembers: number;
    onToggle: (id: string) => void | Promise<void>;
    onAdd: (label: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
}

export default function Checklist({
    checklist,
    currentUserId,
    creatorId,
    totalMembers,
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

    const doneByMe = checklist.filter((t) => t.completedByMe).length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Checklist</h3>
                {checklist.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {doneByMe} / {checklist.length} tasks completed
                    </span>
                )}
            </div>
            {checklist.length > 0 && <Progress value={doneByMe} max={checklist.length} />}
            {checklist.length === 0 && (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
            )}
            <ul className="space-y-2">
                {checklist.map((t) => (
                    <TaskRow
                        key={t.id}
                        task={t}
                        totalMembers={totalMembers}
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
