import { useState } from 'react';
import { Trash2, Pencil, Check, X, ChevronRight, MessageSquare } from 'lucide-react';
import type { Destination } from '@tripcrew/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCost } from '@/utils/cost';
import DestinationDetailsModal from './DestinationDetailsModal';
import type { LatLng } from './DestinationMap';

interface DetailsPayload {
    notes?: string;
    links?: string[];
    tags?: string[];
    location?: LatLng | null;
}

interface DestinationCardProps {
    destination: Destination;
    currentUserId?: string;
    creatorId?: string;
    canDelete: boolean;
    /** Cost edit permission (proposer or trip creator). */
    canEdit?: boolean;
    /** True when this destination has the lowest estimatedCost among the trip's proposals. */
    isLowestBudget?: boolean;
    onDelete: (id: string) => void | Promise<void>;
    onUpdateCost?: (id: string, estimatedCost: number | null) => void | Promise<void>;
    onUpdateDetails?: (id: string, payload: DetailsPayload) => void | Promise<void>;
    onAddComment?: (id: string, text: string) => void | Promise<void>;
    onDeleteComment?: (id: string, commentId: string) => void | Promise<void>;
    onUploadImages?: (id: string, files: File[]) => void | Promise<void>;
    onDeleteImage?: (id: string, imageId: string) => void | Promise<void>;
}

export default function DestinationCard({
    destination,
    currentUserId,
    creatorId,
    canDelete,
    canEdit = false,
    isLowestBudget = false,
    onDelete,
    onUpdateCost,
    onUpdateDetails,
    onAddComment,
    onDeleteComment,
    onUploadImages,
    onDeleteImage,
}: DestinationCardProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [costInput, setCostInput] = useState('');
    const [saving, setSaving] = useState(false);

    // Full-screen details window (Feature 4) replaces the old inline dropdown.
    const [detailsOpen, setDetailsOpen] = useState(false);

    const commentCount = destination.comments.length;

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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
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
                                {isLowestBudget && <Badge variant="success">Lowest budget</Badge>}
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
                        {destination.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                                {tag}
                            </Badge>
                        ))}
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

            <button
                type="button"
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setDetailsOpen(true)}
            >
                Details
                <ChevronRight className="size-3.5" />
                {commentCount > 0 && (
                    <span className="flex items-center gap-0.5">
                        <MessageSquare className="size-3.5" />
                        {commentCount}
                    </span>
                )}
            </button>

            <DestinationDetailsModal
                destination={detailsOpen ? destination : null}
                onClose={() => setDetailsOpen(false)}
                currentUserId={currentUserId}
                creatorId={creatorId}
                isLowestBudget={isLowestBudget}
                onUpdateDetails={onUpdateDetails}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onUploadImages={onUploadImages}
                onDeleteImage={onDeleteImage}
            />

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
