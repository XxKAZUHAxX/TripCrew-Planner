import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { joinTrip } from '@/api/trips.api';
import { getErrorMessage } from '@/utils/errors';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Join() {
    const { inviteCode } = useParams() as { inviteCode: string };
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);

    async function handleJoin() {
        setError(null);
        setJoining(true);
        try {
            const trip = await joinTrip(inviteCode);
            navigate(`/trips/${trip._id}`);
        } catch (err) {
            setError(getErrorMessage(err, 'Could not join trip'));
        } finally {
            setJoining(false);
        }
    }

    return (
        <div className="mx-auto max-w-md px-4 py-16">
            <Card>
                <CardHeader className="items-center text-center">
                    <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Ticket className="size-6" />
                    </span>
                    <CardTitle>Join a trip</CardTitle>
                    <CardDescription>
                        You were invited with code{' '}
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                            {inviteCode}
                        </code>
                        .
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button className="w-full" onClick={handleJoin} disabled={joining}>
                        {joining ? 'Joining…' : 'Join this trip'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
