import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Plus } from 'lucide-react';
import type { Trip, TripStatus } from '@tripcrew/shared';
import { listMyTrips, createTrip } from '@/api/trips.api';
import { getErrorMessage } from '@/utils/errors';
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
        try {
            const trip = await createTrip({ title, votingDeadline: votingDeadline || undefined });
            navigate(`/trips/${trip._id}`);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to create trip'));
        }
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
                                    <Badge variant={STATUS_VARIANT[t.status]} className="uppercase">
                                        {t.status}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

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
                            <Button type="submit" className="w-full">
                                <Plus className="size-4" />
                                Create trip
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
