import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trophy } from 'lucide-react';
import type { ChecklistItem, Destination } from '@tripcrew/shared';
import {
    getPlaybook,
    updateInstructions,
    addTask,
    toggleTask,
    deleteTask,
} from '@/api/playbook.api';
import { getTrip } from '@/api/trips.api';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/errors';
import { refId } from '@/utils/refs';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import SafeMarkdown from '@/components/SafeMarkdown';
import MarkdownEditor from '@/components/MarkdownEditor';
import Checklist from '@/components/Checklist';

export default function PlaybookPage() {
    const { tripId } = useParams() as { tripId: string };
    const { user } = useAuth();

    const [instructions, setInstructions] = useState('');
    const [winningDest, setWinningDest] = useState<Destination | null>(null);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [isCreator, setIsCreator] = useState(false);
    const [creatorId, setCreatorId] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [pb, detail] = await Promise.all([getPlaybook(tripId), getTrip(tripId)]);
            setInstructions(pb.instructions);
            setWinningDest(pb.winningDestination);
            setChecklist(pb.checklist);
            const cId = refId(detail.trip.creator) ?? null;
            setCreatorId(cId);
            setIsCreator(String(cId) === String(user?.id));
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load playbook'));
        } finally {
            setLoading(false);
        }
    }, [tripId, user?.id]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleSaveInstructions(value: string) {
        await updateInstructions(tripId, value);
        setInstructions(value);
        setEditing(false);
    }

    async function handleAddTask(label: string) {
        await addTask(tripId, label);
        await load();
    }

    async function handleToggle(taskId: string) {
        await toggleTask(tripId, taskId);
        await load();
    }

    async function handleDelete(taskId: string) {
        await deleteTask(tripId, taskId);
        await load();
    }

    if (loading) return <PageLoader />;
    if (error)
        return (
            <div className="mx-auto max-w-2xl px-4 py-8">
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Link
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    to={`/trips/${tripId}`}
                >
                    <ArrowLeft className="size-4" />
                    Back to dashboard
                </Link>
            </div>
        );

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Trip Playbook</h1>
                <Link
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    to={`/trips/${tripId}`}
                >
                    <ArrowLeft className="size-4" />
                    Back
                </Link>
            </div>

            {winningDest && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-success">
                    <Trophy className="size-5" />
                    <span>
                        Destination decided: <strong>{winningDest.name}</strong>
                    </span>
                </div>
            )}

            <Card className="mb-4">
                <CardHeader className="flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg">Instructions</CardTitle>
                    {isCreator && (
                        <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
                            <Pencil className="size-4" />
                            {editing ? 'Preview' : 'Edit'}
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {isCreator && editing ? (
                        <MarkdownEditor
                            instructions={instructions}
                            onSave={handleSaveInstructions}
                        />
                    ) : (
                        <SafeMarkdown content={instructions} />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-5">
                    <Checklist
                        checklist={checklist}
                        currentUserId={user?.id}
                        creatorId={creatorId}
                        onToggle={handleToggle}
                        onAdd={handleAddTask}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
