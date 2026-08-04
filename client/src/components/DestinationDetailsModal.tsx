import { useRef, useState } from 'react';
import { X, Pencil, ExternalLink, MessageSquare, ImagePlus, Send } from 'lucide-react';
import type { Destination, UserRef } from '@tripcrew/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCost } from '@/utils/cost';
import { refId } from '@/utils/refs';
import SafeMarkdown from './SafeMarkdown';
import DestinationMap, { type LatLng } from './DestinationMap';

interface DetailsPayload {
    notes?: string;
    links?: string[];
    tags?: string[];
    location?: LatLng | null;
}

interface DestinationDetailsModalProps {
    /** Destination to show; render nothing when null (closed). */
    destination: Destination | null;
    onClose: () => void;
    currentUserId?: string;
    creatorId?: string;
    /** True when this destination has the lowest estimatedCost among the trip's proposals. */
    isLowestBudget?: boolean;
    /** Presence of these handlers gates their respective edit affordances — omit
     * them all to render a read-only view (e.g. during voting). */
    onUpdateDetails?: (id: string, payload: DetailsPayload) => void | Promise<void>;
    onAddComment?: (id: string, text: string) => void | Promise<void>;
    onDeleteComment?: (id: string, commentId: string) => void | Promise<void>;
    onUploadImages?: (id: string, files: File[]) => void | Promise<void>;
    onDeleteImage?: (id: string, imageId: string) => void | Promise<void>;
}

function authorName(ref: string | UserRef | null | undefined): string {
    if (!ref || typeof ref === 'string') return 'Member';
    return ref.name;
}

export default function DestinationDetailsModal({
    destination,
    onClose,
    currentUserId,
    creatorId,
    isLowestBudget = false,
    onUpdateDetails,
    onAddComment,
    onDeleteComment,
    onUploadImages,
    onDeleteImage,
}: DestinationDetailsModalProps) {
    const [editingDetails, setEditingDetails] = useState(false);
    const [notesInput, setNotesInput] = useState('');
    const [linksInput, setLinksInput] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [savingDetails, setSavingDetails] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    if (!destination) return null;

    const canEditDetails = Boolean(onUpdateDetails);
    const canComment = Boolean(onAddComment);
    const canUpload = Boolean(onUploadImages);

    function startEditDetails() {
        if (!destination) return;
        setNotesInput(destination.notes);
        setLinksInput(destination.links.join('\n'));
        setTagsInput(destination.tags.join(', '));
        setEditingDetails(true);
    }

    async function saveDetails() {
        if (!onUpdateDetails || !destination) return;
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
        if (!onAddComment || !destination) return;
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

    async function handleFiles(fileList: FileList | null) {
        if (!onUploadImages || !fileList || fileList.length === 0 || !destination) return;
        setUploading(true);
        try {
            await onUploadImages(destination._id, Array.from(fileList));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 sm:pt-12"
            role="dialog"
            aria-modal="true"
            aria-label={`${destination.name} details`}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl rounded-xl border border-border bg-background shadow-lg animate-in fade-in-0 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-xl border-b bg-background px-5 py-4">
                    <h2 className="text-lg font-semibold">{destination.name}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                        <X className="size-5" />
                    </Button>
                </div>

                <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {destination.description && (
                                <p className="text-sm text-muted-foreground">
                                    {destination.description}
                                </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge
                                    variant={
                                        destination.estimatedCost == null ? 'muted' : 'secondary'
                                    }
                                >
                                    {formatCost(destination.estimatedCost)}
                                </Badge>
                                {isLowestBudget && (
                                    <Badge
                                        variant="success"
                                        title={`Lowest proposed budget · ${authorName(destination.proposedBy)}`}
                                    >
                                        Lowest budget
                                    </Badge>
                                )}
                                {destination.tags.map((tag) => (
                                    <Badge key={tag} variant="outline">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Proposed by {authorName(destination.proposedBy)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                                        <Button
                                            size="sm"
                                            onClick={saveDetails}
                                            disabled={savingDetails}
                                        >
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
                                            <p className="italic text-muted-foreground">
                                                No notes yet.
                                            </p>
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
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={startEditDetails}
                                        >
                                            <Pencil className="size-3.5" />
                                            Edit details
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Photos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {canUpload && (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/gif"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => handleFiles(e.target.files)}
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        <ImagePlus className="size-3.5" />
                                        {uploading ? 'Uploading…' : 'Add photos'}
                                    </Button>
                                </div>
                            )}
                            {destination.images.length === 0 ? (
                                <p className="text-sm italic text-muted-foreground">
                                    No photos yet.
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                    {destination.images.map((img) => {
                                        const uploaderId = refId(img.uploadedBy);
                                        const canRemove =
                                            onDeleteImage !== undefined &&
                                            (uploaderId === currentUserId ||
                                                creatorId === currentUserId);
                                        return (
                                            <div
                                                key={img._id}
                                                className="group relative aspect-square overflow-hidden rounded-md border"
                                            >
                                                <a
                                                    href={img.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <img
                                                        src={img.url}
                                                        alt={`${destination.name} photo`}
                                                        loading="lazy"
                                                        className="size-full object-cover"
                                                    />
                                                </a>
                                                {canRemove && (
                                                    <button
                                                        type="button"
                                                        aria-label="Delete photo"
                                                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 shadow-sm transition hover:text-destructive group-hover:opacity-100"
                                                        onClick={() =>
                                                            onDeleteImage?.(
                                                                destination._id,
                                                                img._id
                                                            )
                                                        }
                                                    >
                                                        <X className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Location</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-1.5 text-sm">
                                <MessageSquare className="size-4" />
                                Comments ({destination.comments.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
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
                            {destination.comments.length === 0 && !canComment && (
                                <p className="text-sm italic text-muted-foreground">
                                    No comments yet.
                                </p>
                            )}
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
