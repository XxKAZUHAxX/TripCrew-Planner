import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Calendar,
    Check,
    ClipboardList,
    Copy,
    Gavel,
    LogOut,
    Sparkles,
    Trash2,
    Vote,
} from 'lucide-react';
import type {
    DashboardResponse,
    Destination,
    ProposeDestinationRequest,
    Trip,
    TripStatus,
    UserRef,
} from '@tripcrew/shared';
import {
    getTrip,
    getDashboard,
    toggleInvite,
    concludeVoting,
    leaveTrip,
    deleteTrip,
} from '@/api/trips.api';
import {
    proposeDestination,
    deleteDestination,
    updateDestination,
    addComment,
    deleteComment,
} from '@/api/destinations.api';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/errors';
import { refId } from '@/utils/refs';
import { isPast } from '@/utils/deadline';
import { TRIP_STATUS_LABEL } from '@/utils/tripStatus';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tooltip } from '@/components/ui/tooltip';
import MembersList from '@/components/MembersList';
import DestinationList from '@/components/DestinationList';
import ScoreBoard from '@/components/ScoreBoard';
import DeadlineBadge from '@/components/DeadlineBadge';

const STATUS_VARIANT: Record<TripStatus, BadgeProps['variant']> = {
    voting: 'secondary',
    decided: 'success',
    archived: 'muted',
};

export default function TripDashboard() {
    const { tripId } = useParams() as { tripId: string };
    const { user } = useAuth();
    const navigate = useNavigate();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [members, setMembers] = useState<UserRef[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [concluding, setConcluding] = useState(false);

    const [deactivateOpen, setDeactivateOpen] = useState(false);
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [concludeOpen, setConcludeOpen] = useState(false);

    const load = useCallback(async () => {
        try {
            const [detail, dash] = await Promise.all([getTrip(tripId), getDashboard(tripId)]);
            setTrip(detail.trip);
            setMembers(detail.members);
            setDestinations(detail.destinations);
            setDashboard(dash);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load trip'));
        } finally {
            setLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        load();
    }, [load]);

    // Auto-conclude when the voting deadline has passed (Issue 3).
    useEffect(() => {
        if (!trip || trip.status !== 'voting') return;
        if (!isPast(trip.votingDeadline)) return;
        let active = true;
        (async () => {
            try {
                await concludeVoting(tripId);
                if (active) await load();
            } catch {
                /* ignore — will retry on next load */
            }
        })();
        return () => {
            active = false;
        };
    }, [trip, tripId, load]);

    async function handlePropose(payload: ProposeDestinationRequest) {
        try {
            await proposeDestination(tripId, payload);
            await load();
            toast.success('Destination proposed!');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to propose destination'));
            throw err;
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteDestination(tripId, id);
            await load();
            toast.success('Destination removed.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to remove destination'));
        }
    }

    async function handleUpdateCost(id: string, estimatedCost: number | null) {
        try {
            await updateDestination(tripId, id, { estimatedCost });
            await load();
            toast.success('Estimated cost updated.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to update cost'));
        }
    }

    async function handleUpdateDetails(
        id: string,
        payload: { notes?: string; links?: string[]; tags?: string[] }
    ) {
        try {
            await updateDestination(tripId, id, payload);
            await load();
            toast.success('Details updated.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to update details'));
        }
    }

    async function handleAddComment(id: string, text: string) {
        try {
            await addComment(tripId, id, text);
            await load();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to add comment'));
        }
    }

    async function handleDeleteComment(id: string, commentId: string) {
        try {
            await deleteComment(tripId, id, commentId);
            await load();
            toast.success('Comment deleted.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to delete comment'));
        }
    }

    async function activateInvite() {
        try {
            const updated = await toggleInvite(tripId, true);
            setTrip(updated);
            toast.success('Invite link reactivated.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to update invite link'));
        }
    }

    async function deactivateInvite() {
        try {
            const updated = await toggleInvite(tripId, false);
            setTrip(updated);
            toast.success('Invite link deactivated.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to update invite link'));
        }
    }

    async function handleLeave() {
        try {
            await leaveTrip(tripId);
            toast.success(`You have left ${trip?.title ?? 'the trip'}.`);
            navigate('/trips');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to leave trip'));
        }
    }

    async function handleDeleteTrip() {
        try {
            await deleteTrip(tripId);
            toast.success(`${trip?.title ?? 'Trip'} was deleted.`);
            navigate('/trips');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to delete trip'));
        }
    }

    async function handleConclude() {
        setConcluding(true);
        try {
            const result = await concludeVoting(tripId);
            await load();
            if (result.wheel) {
                toast.info('Votes are tied — spin the Wheel of Destiny.');
                navigate(`/trips/${tripId}/wheel`);
            } else {
                toast.success('Voting concluded — the destination is decided!');
                navigate(`/trips/${tripId}/playbook`);
            }
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to conclude voting'));
        } finally {
            setConcluding(false);
        }
    }

    function copyInvite() {
        if (!trip) return;
        navigator.clipboard.writeText(`${window.location.origin}/join/${trip.inviteCode}`);
        setCopied(true);
        toast.success('Invite link copied.');
        setTimeout(() => setCopied(false), 1500);
    }

    if (loading) return <PageLoader />;
    if (error)
        return (
            <div className="mx-auto max-w-6xl px-4 py-8">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    if (!trip) return null;

    const creatorId = refId(trip.creator);
    const isCreator = creatorId === user?.id;
    const inviteUrl = `${window.location.origin}/join/${trip.inviteCode}`;
    const isDecided = trip.status === 'decided';
    const isVoting = trip.status === 'voting';
    const deadlinePassed = isPast(trip.votingDeadline);
    const votedCount = dashboard?.votedMemberIds?.length ?? 0;
    const winningDestId = refId(trip.winningDestination);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{trip.title}</h1>
                    <Badge variant={STATUS_VARIANT[trip.status]}>
                        {TRIP_STATUS_LABEL[trip.status]}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                        to={`/trips`}
                    >
                        <ArrowLeft className="size-4" />
                        Back
                    </Link>
                    {!isCreator && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setLeaveOpen(true)}
                        >
                            <LogOut className="size-4" />
                            Leave trip
                        </Button>
                    )}
                    {isCreator && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Trash2 className="size-4" />
                            Delete trip
                        </Button>
                    )}
                </div>
            </div>

            {isVoting && deadlinePassed && (
                <Alert className="mb-4">
                    <AlertDescription>
                        The voting deadline has passed. Calculating the result…
                    </AlertDescription>
                </Alert>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-2">
                {isDecided ? (
                    <Tooltip content="Voting is closed.">
                        <span
                            className={cn(
                                buttonVariants({ variant: 'outline', size: 'sm' }),
                                'cursor-not-allowed opacity-50'
                            )}
                            aria-disabled
                        >
                            <Vote className="size-4" />
                            Vote
                        </span>
                    </Tooltip>
                ) : (
                    <Link
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        to={`/trips/${tripId}/vote`}
                    >
                        <Vote className="size-4" />
                        Vote
                    </Link>
                )}
                <Link
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    to={`/trips/${tripId}/availability`}
                >
                    <Calendar className="size-4" />
                    Availability
                </Link>
                {dashboard?.deadlock?.eligible && isVoting && (
                    <Link
                        className={cn(buttonVariants({ variant: 'warning', size: 'sm' }))}
                        to={`/trips/${tripId}/wheel`}
                    >
                        <Sparkles className="size-4" />
                        Wheel of Destiny
                    </Link>
                )}
                {trip.status !== 'voting' && (
                    <Link
                        className={cn(buttonVariants({ variant: 'success', size: 'sm' }))}
                        to={`/trips/${tripId}/playbook`}
                    >
                        <ClipboardList className="size-4" />
                        Playbook
                    </Link>
                )}
                {isCreator && isVoting && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConcludeOpen(true)}
                        disabled={concluding}
                    >
                        <Gavel className="size-4" />
                        {concluding ? 'Concluding…' : 'Conclude voting now'}
                    </Button>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Members</h2>
                    <MembersList
                        members={members}
                        creatorId={creatorId}
                        badges={dashboard?.badges}
                        definitions={dashboard?.definitions}
                        votedMemberIds={dashboard?.votedMemberIds}
                        optedOutMemberIds={dashboard?.optedOutMemberIds}
                    />
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Invite link</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex gap-2">
                                <Input readOnly value={inviteUrl} className="text-xs" />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyInvite}
                                    aria-label="Copy invite link"
                                >
                                    {copied ? (
                                        <Check className="size-4 text-success" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                </Button>
                            </div>
                            {isCreator && (
                                <Button
                                    variant={trip.inviteActive ? 'outline' : 'secondary'}
                                    size="sm"
                                    className={cn(
                                        'w-full',
                                        trip.inviteActive &&
                                            'text-destructive hover:text-destructive'
                                    )}
                                    onClick={
                                        trip.inviteActive
                                            ? () => setDeactivateOpen(true)
                                            : activateInvite
                                    }
                                >
                                    {trip.inviteActive ? 'Deactivate link' : 'Reactivate link'}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Destinations</h2>
                    <DestinationList
                        destinations={destinations}
                        currentUserId={user?.id}
                        creatorId={creatorId}
                        status={trip.status}
                        onPropose={handlePropose}
                        onDelete={handleDelete}
                        onUpdateCost={handleUpdateCost}
                        onUpdateDetails={handleUpdateDetails}
                        onAddComment={handleAddComment}
                        onDeleteComment={handleDeleteComment}
                    />
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Live scores</h2>
                    <DeadlineBadge deadline={trip.votingDeadline} />
                    <Card>
                        <CardContent className="pt-5">
                            <ScoreBoard
                                scores={dashboard?.scores || []}
                                status={trip.status}
                                winningDestId={winningDestId}
                            />
                            <p className="mt-3 text-xs text-muted-foreground">
                                {votedCount} of {members.length} member
                                {members.length === 1 ? '' : 's'} have voted.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={deactivateOpen}
                onOpenChange={setDeactivateOpen}
                title="Deactivate invite link?"
                description="Deactivate the invite link? Anyone with the old link will no longer be able to join."
                confirmLabel="Deactivate"
                onConfirm={deactivateInvite}
            />
            <ConfirmDialog
                open={leaveOpen}
                onOpenChange={setLeaveOpen}
                title="Leave this trip?"
                description={`Are you sure you want to leave ${trip.title}? You will need a new invite to rejoin.`}
                confirmLabel="Leave trip"
                onConfirm={handleLeave}
            />
            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete this trip?"
                description={`This will permanently delete ${trip.title} and all its data. This action cannot be undone.`}
                confirmLabel="Delete trip"
                onConfirm={handleDeleteTrip}
            />
            <ConfirmDialog
                open={concludeOpen}
                onOpenChange={setConcludeOpen}
                title="Conclude voting now?"
                description="End voting early and determine the winner based on current votes?"
                confirmLabel="Conclude voting"
                confirmVariant="default"
                onConfirm={handleConclude}
            />
        </div>
    );
}
