import { useState } from 'react';
import {
    Trash2,
    Pencil,
    Check,
    X,
    ChevronDown,
    MessageSquare,
    ExternalLink,
    Send,
} from 'lucide-react';
import type { Destination, UserRef } from '@tripcrew/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCost } from '@/utils/cost';
import { refId } from '@/utils/refs';
import { cn } from '@/lib/utils';
import SafeMarkdown from './SafeMarkdown';
import DestinationMap, { type LatLng } from './DestinationMap';

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
    onDelete: (id: string) => void | Promise<void>;
    onUpdateCost?: (id: string, estimatedCost: number | null) => void | Promise<void>;
    onUpdateDetails?: (id: string, payload: DetailsPayload) => void | Promise<void>;
    onAddComment?: (id: string, text: string) => void | Promise<void>;
    onDeleteComment?: (id: string, commentId: string) => void | Promise<void>;
}

function authorName(ref: string | UserRef): string {
    return typeof ref === 'string' ? 'Member' : ref.name;
}

export default function DestinationCard({
    destination,
    currentUserId,
    creatorId,
    canDelete,
    canEdit = false,
    onDelete,
    onUpdateCost,
    onUpdateDetails,
    onAddComment,
    onDeleteComment,
}: DestinationCardProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [costInput, setCostInput] = useState('');
    const [saving, setSaving] = useState(false);

    // Expandable "make the case" panel (Feature 4).
    const [expanded, setExpanded] = useState(false);
    const [editingDetails, setEditingDetails] = useState(false);
    const [notesInput, setNotesInput] = useState('');
    const [linksInput, setLinksInput] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [savingDetails, setSavingDetails] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    const canComment = Boolean(onAddComment);
    const canEditDetails = Boolean(onUpdateDetails);
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

    function startEditDetails() {
        setNotesInput(destination.notes);
        setLinksInput(destination.links.join('\n'));
        setTagsInput(destination.tags.join(', '));
        setEditingDetails(true);
    }

    async function saveDetails() {
        if (!onUpdateDetails) return;
        const links = linksInput
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
        const tags = tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        setSavingDetails(true);
        try {
            await onUpdateDetails(destination._id, { notes: notesInput, links, tags });
            setEditingDetails(false);
        } finally {
            setSavingDetails(false);
        }
    }

    async function postComment() {
        if (!onAddComment) return;
        const text = commentInput.trim();
        if (!text) return;
        setPostingComment(true);
        try {
            await onAddComment(destination._id, text);
            setCommentInput('');
        } finally {
            setPostingComment(false);
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
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
            >
                <ChevronDown
                    className={cn('size-3.5 transition-transform', expanded && 'rotate-180')}
                />
                Details
                {commentCount > 0 && (
                    <span className="flex items-center gap-0.5">
                        <MessageSquare className="size-3.5" />
                        {commentCount}
                    </span>
                )}
            </button>

            {expanded && (
                <div className="mt-3 space-y-4 border-t pt-3">
                    {editingDetails ? (
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-muted-foreground">
                                Notes (Markdown supported)
                                <textarea
                                    className="mt-1 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={notesInput}
                                    onChange={(e) => setNotesInput(e.target.value)}
                                    placeholder="Make the case for this destination…"
                                />
                            </label>
                            <label className="block text-xs font-medium text-muted-foreground">
                                Links (one URL per line)
                                <textarea
                                    className="mt-1 min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={linksInput}
                                    onChange={(e) => setLinksInput(e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </label>
                            <label className="block text-xs font-medium text-muted-foreground">
                                Tags (comma-separated)
                                <Input
                                    className="mt-1"
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    placeholder="beach, budget, foodie"
                                />
                            </label>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={saveDetails} disabled={savingDetails}>
                                    {savingDetails ? 'Saving…' : 'Save details'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingDetails(false)}
                                    disabled={savingDetails}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="text-sm">
                                {destination.notes ? (
                                    <SafeMarkdown content={destination.notes} />
                                ) : (
                                    <p className="italic text-muted-foreground">No notes yet.</p>
                                )}
                            </div>
                            {destination.links.length > 0 && (
                                <ul className="space-y-1">
                                    {destination.links.map((link) => (
                                        <li key={link}>
                                            <a
                                                href={link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                            >
                                                <ExternalLink className="size-3.5 shrink-0" />
                                                <span className="truncate">{link}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {canEditDetails && (
                                <Button size="sm" variant="outline" onClick={startEditDetails}>
                                    <Pencil className="size-3.5" />
                                    Edit details
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Location</p>
                        <DestinationMap
                            location={destination.location}
                            editable={canEditDetails}
                            onPick={
                                canEditDetails && onUpdateDetails
                                    ? (loc) => onUpdateDetails(destination._id, { location: loc })
                                    : undefined
                            }
                        />
                        {canEditDetails && destination.location && onUpdateDetails && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                    onUpdateDetails(destination._id, { location: null })
                                }
                            >
                                <X className="size-3.5" />
                                Clear pin
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Comments ({commentCount})
                        </p>
                        {destination.comments.map((c) => {
                            const authorId = refId(c.userId);
                            const canRemove =
                                onDeleteComment !== undefined &&
                                (authorId === currentUserId || creatorId === currentUserId);
                            return (
                                <div
                                    key={c._id}
                                    className="flex items-start justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5"
                                >
                                    <div className="min-w-0">
                                        <span className="text-xs font-medium">
                                            {authorName(c.userId)}
                                        </span>
                                        <p className="whitespace-pre-wrap break-words text-sm">
                                            {c.text}
                                        </p>
                                    </div>
                                    {canRemove && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                onDeleteComment?.(destination._id, c._id)
                                            }
                                            aria-label="Delete comment"
                                        >
                                            <X className="size-3.5" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                        {canComment && (
                            <div className="flex items-center gap-1.5">
                                <Input
                                    className="h-8"
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            postComment();
                                        }
                                    }}
                                    placeholder="Add a comment…"
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-8 shrink-0"
                                    onClick={postComment}
                                    disabled={postingComment || !commentInput.trim()}
                                    aria-label="Post comment"
                                >
                                    <Send className="size-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
