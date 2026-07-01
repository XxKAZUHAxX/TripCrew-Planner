import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Ticket, Users } from 'lucide-react';
import type { TripPreviewResponse } from '@tripcrew/shared';
import { joinTrip, previewTrip } from '@/api/trips.api';
import { getErrorMessage } from '@/utils/errors';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';

export default function Join() {
    const { inviteCode } = useParams() as { inviteCode: string };
    const navigate = useNavigate();
    const [preview, setPreview] = useState<TripPreviewResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const data = await previewTrip(inviteCode);
                if (!active) return;
                setPreview(data);
                if (!data.inviteActive) {
                    setError('This invite code is invalid or has expired.');
                }
            } catch (err) {
                if (active) {
                    setError(getErrorMessage(err, 'This invite code is invalid or has expired.'));
                }
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => {
            active = false;
        };
    }, [inviteCode]);

    async function handleJoin() {
        setError(null);
        setJoining(true);
        try {
            const trip = await joinTrip(inviteCode);
            toast.success(`Welcome to ${trip.title}!`);
            navigate(`/trips/${trip._id}`);
        } catch (err) {
            const message = getErrorMessage(err, 'This invite code is invalid or has expired.');
            setError(message);
            toast.error(message);
        } finally {
            setJoining(false);
        }
    }

    if (loading) return <PageLoader />;

    return (
        <div className="mx-auto max-w-md px-4 py-16">
            <Card>
                <CardHeader className="items-center text-center">
                    <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Ticket className="size-6" />
                    </span>
                    <CardTitle>Join a trip</CardTitle>
                    {preview && !error ? (
                        <CardDescription>
                            You’ve been invited to join <strong>{preview.title}</strong> ·{' '}
                            {preview.memberCount} {preview.memberCount === 1 ? 'member' : 'members'}{' '}
                            already joined.
                        </CardDescription>
                    ) : (
                        <CardDescription>
                            You were invited with code{' '}
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                                {inviteCode}
                            </code>
                            .
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {preview && preview.alreadyMember ? (
                        <div className="space-y-3 text-center">
                            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                                <Users className="size-4" />
                                You’re already a member of this trip.
                            </p>
                            <Button className="w-full" onClick={handleJoin} disabled={joining}>
                                {joining ? 'Opening…' : 'Go to trip dashboard'}
                            </Button>
                        </div>
                    ) : (
                        !error && (
                            <Button className="w-full" onClick={handleJoin} disabled={joining}>
                                {joining ? 'Joining…' : 'Join this trip'}
                            </Button>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
