import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Check, ClipboardList, Copy, Sparkles, Vote } from 'lucide-react';
import type {
    DashboardResponse,
    Destination,
    ProposeDestinationRequest,
    Trip,
    TripStatus,
    UserRef,
} from '@tripcrew/shared';
import { getTrip, getDashboard, toggleInvite } from '@/api/trips.api';
import { proposeDestination, deleteDestination } from '@/api/destinations.api';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/errors';
import { refId } from '@/utils/refs';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import MembersList from '@/components/MembersList';
import DestinationList from '@/components/DestinationList';
import ScoreBoard from '@/components/ScoreBoard';

const STATUS_VARIANT: Record<TripStatus, BadgeProps['variant']> = {
    voting: 'secondary',
    decided: 'success',
    archived: 'muted',
};

export default function TripDashboard() {
    const { tripId } = useParams() as { tripId: string };
    const { user } = useAuth();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [members, setMembers] = useState<UserRef[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

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

    async function handlePropose(payload: ProposeDestinationRequest) {
        await proposeDestination(tripId, payload);
        await load();
    }

    async function handleDelete(id: string) {
        await deleteDestination(tripId, id);
        await load();
    }

    async function handleToggleInvite() {
        if (!trip) return;
        const updated = await toggleInvite(tripId, !trip.inviteActive);
        setTrip(updated);
    }

    function copyInvite() {
        if (!trip) return;
        navigator.clipboard.writeText(`${window.location.origin}/join/${trip.inviteCode}`);
        setCopied(true);
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

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{trip.title}</h1>
                    <Badge variant={STATUS_VARIANT[trip.status]} className="uppercase">
                        {trip.status}
                    </Badge>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                <Link
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    to={`/trips/${tripId}/vote`}
                >
                    <Vote className="size-4" />
                    Vote
                </Link>
                <Link
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    to={`/trips/${tripId}/availability`}
                >
                    <Calendar className="size-4" />
                    Availability
                </Link>
                {dashboard?.deadlock?.eligible && trip.status === 'voting' && (
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
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Members</h2>
                    <MembersList
                        members={members}
                        creatorId={creatorId}
                        badges={dashboard?.badges}
                        definitions={dashboard?.definitions}
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
                                    onClick={handleToggleInvite}
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
                        onPropose={handlePropose}
                        onDelete={handleDelete}
                    />
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Live scores</h2>
                    <Card>
                        <CardContent className="pt-5">
                            <ScoreBoard scores={dashboard?.scores || []} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
