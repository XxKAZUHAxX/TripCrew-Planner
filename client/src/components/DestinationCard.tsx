import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import type { Destination } from '@tripcrew/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCost } from '@/utils/cost';

interface DestinationCardProps {
    destination: Destination;
    canDelete: boolean;
    canEdit?: boolean;
    onDelete: (id: string) => void | Promise<void>;
    onUpdateCost?: (id: string, estimatedCost: number | null) => void | Promise<void>;
}

export default function DestinationCard({
    destination,
    canDelete,
    canEdit = false,
    onDelete,
    onUpdateCost,
}: DestinationCardProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [costInput, setCostInput] = useState('');
    const [saving, setSaving] = useState(false);

    function startEdit() {
        setCostInput(destination.estimatedCost == null ? '' : String(destination.estimatedCost));
        setEditing(true);
    }

    async function saveCost() {
        if (!onUpdateCost) return;
        const trimmed = costInput.trim();
        const value = trimmed === '' ? null : Number(trimmed);
        if (value !== null && (!Number.isFinite(value) || value < 0)) return;
        setSaving(true);
        try {
            await onUpdateCost(destination._id, value);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-lg border bg-card p-3 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="font-medium">{destination.name}</h3>
                    {destination.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {destination.description}
                        </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                        {editing ? (
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    min={0}
                                    step="any"
                                    inputMode="numeric"
                                    className="h-8 w-32"
                                    placeholder="No estimate"
                                    value={costInput}
                                    onChange={(e) => setCostInput(e.target.value)}
                                    autoFocus
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-success"
                                    onClick={saveCost}
                                    disabled={saving}
                                    aria-label="Save cost"
                                >
                                    <Check className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground"
                                    onClick={() => setEditing(false)}
                                    disabled={saving}
                                    aria-label="Cancel edit"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Badge
                                    variant={
                                        destination.estimatedCost == null ? 'muted' : 'secondary'
                                    }
                                >
                                    {formatCost(destination.estimatedCost)}
                                </Badge>
                                {canEdit && onUpdateCost && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-muted-foreground hover:text-foreground"
                                        onClick={startEdit}
                                        aria-label="Edit estimated cost"
                                    >
                                        <Pencil className="size-3.5" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
                {canDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmOpen(true)}
                        aria-label="Remove destination"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Remove destination"
                description={`Remove ${destination.name} from the list? This cannot be undone.`}
                confirmLabel="Remove"
                onConfirm={() => onDelete(destination._id)}
            />
        </div>
    );
}
