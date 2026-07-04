import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trophy, Users } from 'lucide-react';
import type { ChecklistItem, Destination, UserRef } from '@tripcrew/shared';
import {
    getPlaybook,
    updateInstructions,
    addTask,
    toggleTask,
    deleteTask,
} from '@/api/playbook.api';
import { getTrip, updatePlaybookEditors } from '@/api/trips.api';
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
    const [canEdit, setCanEdit] = useState(false);
    const [creatorId, setCreatorId] = useState<string | null>(null);
    const [members, setMembers] = useState<UserRef[]>([]);
    const [editorIds, setEditorIds] = useState<string[]>([]);
    const [savingEditors, setSavingEditors] = useState(false);
    const [memberCount, setMemberCount] = useState(0);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [pb, detail] = await Promise.all([getPlaybook(tripId), getTrip(tripId)]);
            setInstructions(pb.instructions);
            setWinningDest(pb.winningDestination);
            setChecklist(pb.checklist);
            setMembers(detail.members);
            setMemberCount(detail.members.length);
            const cId = refId(detail.trip.creator) ?? null;
            setCreatorId(cId);
            const editors = (detail.trip.playbookEditors ?? [])
                .map((e) => refId(e))
                .filter((id): id is string => Boolean(id));
            setEditorIds(editors);
            const creator = String(cId) === String(user?.id);
            setIsCreator(creator);
            setCanEdit(creator || (user?.id ? editors.includes(user.id) : false));
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
        try {
            await updateInstructions(tripId, value);
            setInstructions(value);
            setEditing(false);
            toast.success('Instructions saved.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to save instructions'));
        }
    }

    async function handleToggleEditor(memberId: string) {
        const next = editorIds.includes(memberId)
            ? editorIds.filter((id) => id !== memberId)
            : [...editorIds, memberId];
        setSavingEditors(true);
        try {
            const trip = await updatePlaybookEditors(tripId, next);
            const updated = (trip.playbookEditors ?? [])
                .map((e) => refId(e))
                .filter((id): id is string => Boolean(id));
            setEditorIds(updated);
            toast.success('Playbook editors updated.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to update editors'));
        } finally {
            setSavingEditors(false);
        }
    }

    async function handleAddTask(label: string) {
        try {
            await addTask(tripId, label);
            await load();
            toast.success('Task added.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to add task'));
        }
    }

    async function handleToggle(taskId: string) {
        try {
            await toggleTask(tripId, taskId);
            await load();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to update task'));
        }
    }

    async function handleDelete(taskId: string) {
        try {
            await deleteTask(tripId, taskId);
            await load();
            toast.success('Task deleted.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to delete task'));
        }
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
                    {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
                            <Pencil className="size-4" />
                            {editing ? 'Preview' : 'Edit'}
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {canEdit && editing ? (
                        <MarkdownEditor
                            instructions={instructions}
                            onSave={handleSaveInstructions}
                        />
                    ) : (
                        <SafeMarkdown content={instructions} />
                    )}
                </CardContent>
            </Card>

            {isCreator && members.length > 1 && (
                <Card className="mb-4">
                    <CardHeader className="flex-row items-center gap-2 pb-3">
                        <Users className="size-4 text-muted-foreground" />
                        <CardTitle className="text-lg">Playbook editors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-3 text-sm text-muted-foreground">
                            Grant members permission to edit the playbook instructions. You can
                            always edit as the host.
                        </p>
                        <ul className="divide-y divide-border">
                            {members
                                .filter((m) => m._id !== creatorId)
                                .map((m) => {
                                    const granted = editorIds.includes(m._id);
                                    return (
                                        <li
                                            key={m._id}
                                            className="flex items-center justify-between gap-3 py-2"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">
                                                    {m.name}
                                                </span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {m.email}
                                                </span>
                                            </span>
                                            <Button
                                                variant={granted ? 'default' : 'outline'}
                                                size="sm"
                                                disabled={savingEditors}
                                                onClick={() => handleToggleEditor(m._id)}
                                            >
                                                {granted ? 'Can edit' : 'Grant edit'}
                                            </Button>
                                        </li>
                                    );
                                })}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="pt-5">
                    <Checklist
                        checklist={checklist}
                        currentUserId={user?.id}
                        creatorId={creatorId}
                        totalMembers={memberCount}
                        onToggle={handleToggle}
                        onAdd={handleAddTask}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
