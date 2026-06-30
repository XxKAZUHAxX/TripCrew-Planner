import { Trash2 } from 'lucide-react';
import type { ChecklistItem } from '@tripcrew/shared';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TaskRowProps {
    task: ChecklistItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    canDelete: boolean;
}

// Individual checklist row.
export default function TaskRow({ task, onToggle, onDelete, canDelete }: TaskRowProps) {
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
                <Badge variant="muted">{task.completedByCount} done</Badge>
                {canDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(task.id)}
                        aria-label="Delete task"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>
        </li>
    );
}
