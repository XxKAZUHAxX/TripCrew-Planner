import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ChecklistItem } from '@tripcrew/shared';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface TaskRowProps {
    task: ChecklistItem;
    /** Total members, for the "x of y completed" label (Issue 4). */
    totalMembers: number;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void | Promise<void>;
    canDelete: boolean;
}

// Individual checklist row.
export default function TaskRow({
    task,
    totalMembers,
    onToggle,
    onDelete,
    canDelete,
}: TaskRowProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    return (
        <li className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2">
                <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-primary"
                    checked={task.completedByMe}
                    onChange={() => onToggle(task.id)}
                />
                <span
                    className={cn(
                        'text-sm',
                        task.completedByMe && 'text-muted-foreground line-through'
                    )}
                >
                    {task.label}
                </span>
            </label>
            <div className="flex items-center gap-2">
                <Badge variant="muted">
                    {task.completedByCount} of {totalMembers} completed
                </Badge>
                {canDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmOpen(true)}
                        aria-label="Delete task"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete task"
                description="Delete this task? All completion records will be lost."
                confirmLabel="Delete"
                onConfirm={() => onDelete(task.id)}
            />
        </li>
    );
}
