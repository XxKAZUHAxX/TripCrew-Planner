import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin, Plus, Ticket } from 'lucide-react';
import type { Trip, TripStatus } from '@tripcrew/shared';
import { listMyTrips, createTrip } from '@/api/trips.api';
import { getErrorMessage } from '@/utils/errors';
import { TRIP_STATUS_LABEL } from '@/utils/tripStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_VARIANT: Record<TripStatus, BadgeProps['variant']> = {
    voting: 'secondary',
    decided: 'success',
    archived: 'muted',
};

export default function TripsList() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [title, setTitle] = useState('');
    const [votingDeadline, setVotingDeadline] = useState('');
    const [creating, setCreating] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function load() {
        try {
            setTrips(await listMyTrips());
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load trips'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleCreate(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setCreating(true);
        try {
            const trip = await createTrip({ title, votingDeadline: votingDeadline || undefined });
            toast.success('Trip created!');
            navigate(`/trips/${trip._id}`);
        } catch (err) {
            const message = getErrorMessage(err, 'Failed to create trip');
            setError(message);
            toast.error(message);
        } finally {
            setCreating(false);
        }
    }

    function handleJoinByCode(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const code = inviteCode.trim();
        if (!code) return;
        setInviteCode('');
        navigate(`/join/${encodeURIComponent(code)}`);
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div>
                    <h1 className="mb-4 text-2xl font-bold">My Trips</h1>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : trips.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <MapPin className="size-6" />
                                </span>
                                <p className="font-medium">No trips yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Create your first trip to start planning with your crew.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {trips.map((t) => (
                                <Link
                                    key={t._id}
                                    to={`/trips/${t._id}`}
                                    className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/30"
                                >
                                    <span className="flex items-center gap-2 font-medium">
                                        <MapPin className="size-4 text-primary" />
                                        {t.title}
                                    </span>
                                    <Badge variant={STATUS_VARIANT[t.status]}>
                                        {TRIP_STATUS_LABEL[t.status]}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg">Create a trip</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreate} className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="deadline">Voting deadline (optional)</Label>
                                    <Input
                                        id="deadline"
                                        type="datetime-local"
                                        value={votingDeadline}
                                        onChange={(e) => setVotingDeadline(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={creating}>
                                    <Plus className="size-4" />
                                    {creating ? 'Creating…' : 'Create trip'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg">Have an invite code?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleJoinByCode} className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="invite-code">Enter invite code</Label>
                                    <Input
                                        id="invite-code"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                        placeholder="e.g. a1b2c3d4e5"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="w-full"
                                    disabled={!inviteCode.trim()}
                                >
                                    <Ticket className="size-4" />
                                    Join trip
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
