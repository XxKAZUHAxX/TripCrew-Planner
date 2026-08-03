import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Destination, ProposeDestinationRequest, TripStatus } from '@tripcrew/shared';
import { refId } from '@/utils/refs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/tooltip';
import DestinationCard from './DestinationCard';

interface DestinationListProps {
    destinations: Destination[];
    currentUserId: string | undefined;
    creatorId: string | undefined;
    /** Trip status; proposals are only allowed while 'voting' (Issue 6). */
    status?: TripStatus;
    onPropose: (payload: ProposeDestinationRequest) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    onUpdateCost: (id: string, estimatedCost: number | null) => void | Promise<void>;
    onUpdateDetails: (
        id: string,
        payload: {
            notes?: string;
            links?: string[];
            tags?: string[];
            location?: { lat: number; lng: number } | null;
        }
    ) => void | Promise<void>;
    onAddComment: (id: string, text: string) => void | Promise<void>;
    onDeleteComment: (id: string, commentId: string) => void | Promise<void>;
    onUploadImages: (id: string, files: File[]) => void | Promise<void>;
    onDeleteImage: (id: string, imageId: string) => void | Promise<void>;
}

export default function DestinationList({
    destinations,
    currentUserId,
    creatorId,
    status = 'voting',
    onPropose,
    onDelete,
    onUpdateCost,
    onUpdateDetails,
    onAddComment,
    onDeleteComment,
    onUploadImages,
    onDeleteImage,
}: DestinationListProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [cost, setCost] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const proposalsOpen = status === 'voting';

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!proposalsOpen) return;
        setSubmitting(true);
        try {
            const trimmed = cost.trim();
            const estimatedCost = trimmed === '' ? null : Number(trimmed);
            await onPropose({ name, description, estimatedCost });
            setName('');
            setDescription('');
            setCost('');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-4">
            <Card className={cn(!proposalsOpen && 'opacity-60')}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Propose a destination</CardTitle>
                </CardHeader>
                <CardContent>
                    {!proposalsOpen && (
                        <p className="mb-3 text-sm text-muted-foreground">
                            Destination proposals are closed.
                        </p>
                    )}
                    <fieldset disabled={!proposalsOpen} className="min-w-0">
                        <form onSubmit={handleSubmit} className="space-y-2">
                            <Input
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <Input
                                placeholder="Description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <div className="space-y-1">
                                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    Estimated cost (₱)
                                    <InfoTooltip content="Rough per-person estimate for the whole trip. Optional and editable later." />
                                </span>
                                <Input
                                    type="number"
                                    min={0}
                                    step="any"
                                    inputMode="numeric"
                                    placeholder="e.g. 5000 (optional)"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full"
                                disabled={submitting || !proposalsOpen}
                            >
                                <Plus className="size-4" />
                                {submitting ? 'Adding…' : 'Add destination'}
                            </Button>
                        </form>
                    </fieldset>
                </CardContent>
            </Card>

            {destinations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No destinations proposed yet.</p>
            ) : (
                <div className="space-y-2">
                    {destinations.map((d) => {
                        const proposerId = refId(d.proposedBy);
                        const canManage =
                            proposerId === currentUserId || creatorId === currentUserId;
                        return (
                            <DestinationCard
                                key={d._id}
                                destination={d}
                                currentUserId={currentUserId}
                                creatorId={creatorId}
                                canDelete={canManage}
                                canEdit={canManage}
                                onDelete={onDelete}
                                onUpdateCost={onUpdateCost}
                                onUpdateDetails={onUpdateDetails}
                                onAddComment={onAddComment}
                                onDeleteComment={onDeleteComment}
                                onUploadImages={onUploadImages}
                                onDeleteImage={onDeleteImage}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
