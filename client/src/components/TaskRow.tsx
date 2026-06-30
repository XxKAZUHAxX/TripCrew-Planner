import type { ChecklistItem } from '@tripcrew/shared';

interface TaskRowProps {
    task: ChecklistItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    canDelete: boolean;
}

// Individual checklist row.
export default function TaskRow({ task, onToggle, onDelete, canDelete }: TaskRowProps) {
    return (
        <li className="list-group-item d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
                <input
                    type="checkbox"
                    className="form-check-input"
                    checked={task.completedByMe}
                    onChange={() => onToggle(task.id)}
                    id={`task-${task.id}`}
                />
                <label
                    htmlFor={`task-${task.id}`}
                    className={task.completedByMe ? 'text-decoration-line-through text-muted' : ''}
                >
                    {task.label}
                </label>
            </div>
            <div className="d-flex align-items-center gap-2">
                <span className="badge bg-light text-dark border">
                    {task.completedByCount} done
                </span>
                {canDelete && (
                    <button
                        className="btn btn-sm btn-outline-danger py-0"
                        onClick={() => onDelete(task.id)}
                    >
                        ✕
                    </button>
                )}
            </div>
        </li>
    );
}
