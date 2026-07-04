import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Users, CalendarClock, UserX } from 'lucide-react';
import type { AvailabilitySummaryEntry, AvailabilityStatus, Heatmap } from '@tripcrew/shared';
import {
    getMyAvailability,
    saveAvailability,
    getHeatmap,
    getAvailabilitySummary,
    optOutOfTrip,
} from '@/api/availability.api';
import { getTrip, updateTrip } from '@/api/trips.api';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/errors';
import { formatDeadline } from '@/utils/deadline';
import { refId } from '@/utils/refs';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageLoader } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import DeadlineBadge from '@/components/DeadlineBadge';
import CalendarGrid from '@/components/CalendarGrid';

type DragMode = 'add' | 'remove';

// Convert an ISO timestamp to the value a <input type="datetime-local"> expects
// (local time, no timezone suffix). Returns '' for null/invalid input.
function toDateTimeLocal(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Allow navigating from the current month up to this many months forward.
const MAX_MONTHS_FORWARD = 6;

function monthRefFromOffset(offset: number): { year: number; monthIndex: number } {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    return { year: d.getUTCFullYear(), monthIndex: d.getUTCMonth() };
}

export default function AvailabilityPage() {
    const { tripId } = useParams() as { tripId: string };
    const { user } = useAuth();
    const [myDates, setMyDates] = useState<Set<string>>(new Set());
    const [heatmap, setHeatmap] = useState<Heatmap>({});
    const [summary, setSummary] = useState<AvailabilitySummaryEntry[]>([]);
    const [memberCount, setMemberCount] = useState(0);
    const [monthOffset, setMonthOffset] = useState(0);
    const [summaryOpen, setSummaryOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Opt-out state (Feature 1).
    const [status, setStatus] = useState<AvailabilityStatus>('pending');
    const [optOutOpen, setOptOutOpen] = useState(false);
    const [optingOut, setOptingOut] = useState(false);

    // Availability deadline (Feature 10) — host-settable, must be >= votingDeadline.
    const [isHost, setIsHost] = useState(false);
    const [votingDeadline, setVotingDeadline] = useState<string | null>(null);
    const [availabilityDeadline, setAvailabilityDeadline] = useState<string | null>(null);
    const [deadlineInput, setDeadlineInput] = useState('');
    const [savingDeadline, setSavingDeadline] = useState(false);

    const dragRef = useRef<{ active: boolean; mode: DragMode }>({ active: false, mode: 'add' });
    const { year, monthIndex } = monthRefFromOffset(monthOffset);

    const refreshGroupData = useCallback(async () => {
        const [heat, sum] = await Promise.all([getHeatmap(tripId), getAvailabilitySummary(tripId)]);
        setHeatmap(heat);
        setSummary(sum.entries);
        setMemberCount(sum.memberCount);
    }, [tripId]);

    const loadData = useCallback(async () => {
        try {
            const [mine, detail] = await Promise.all([
                getMyAvailability(tripId),
                getTrip(tripId),
                refreshGroupData(),
            ]);
            setMyDates(new Set(mine.dates));
            setStatus(mine.status);
            setIsHost(refId(detail.trip.creator) === user?.id);
            setVotingDeadline(detail.trip.votingDeadline);
            setAvailabilityDeadline(detail.trip.availabilityDeadline);
            setDeadlineInput(toDateTimeLocal(detail.trip.availabilityDeadline));
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load availability'));
        } finally {
            setLoading(false);
        }
    }, [tripId, refreshGroupData, user?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Lift pointerup globally so dragging outside the grid still ends the drag.
    useEffect(() => {
        function onPointerUp() {
            if (dragRef.current.active) {
                dragRef.current.active = false;
                handleSave();
            }
        }
        window.addEventListener('pointerup', onPointerUp);
        return () => window.removeEventListener('pointerup', onPointerUp);
    }, [myDates]);

    function handlePointerDown(key: string) {
        const mode: DragMode = myDates.has(key) ? 'remove' : 'add';
        dragRef.current = { active: true, mode };
        applyMode(key, mode);
    }

    function handlePointerEnter(key: string) {
        if (!dragRef.current.active) return;
        applyMode(key, dragRef.current.mode);
    }

    function applyMode(key: string, mode: DragMode) {
        setMyDates((prev) => {
            const next = new Set(prev);
            if (mode === 'add') next.add(key);
            else next.delete(key);
            return next;
        });
    }

    async function handleSave() {
        setSaving(true);
        try {
            await saveAvailability(tripId, [...myDates].sort());
            await refreshGroupData();
            toast.success('Availability saved.');
        } catch (err) {
            const message = getErrorMessage(err, 'Failed to save');
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    }

    async function handleOptOut() {
        setOptingOut(true);
        try {
            await optOutOfTrip(tripId);
            setStatus('opted_out');
            setMyDates(new Set());
            await refreshGroupData();
            toast.success('You have opted out of this trip.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to opt out'));
        } finally {
            setOptingOut(false);
            setOptOutOpen(false);
        }
    }

    async function handleRejoin() {
        try {
            await saveAvailability(tripId, [...myDates].sort());
            setStatus('submitted');
            await refreshGroupData();
            toast.success('Welcome back — you have rejoined the trip.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to rejoin'));
        }
    }

    async function handleSaveDeadline() {
        const iso = deadlineInput ? new Date(deadlineInput).toISOString() : null;
        // Mirror the server rule: availability deadline must be >= voting deadline.
        if (iso && votingDeadline && new Date(iso) < new Date(votingDeadline)) {
            const msg = 'Availability deadline must be on or after the voting deadline.';
            setError(msg);
            toast.error(msg);
            return;
        }
        setSavingDeadline(true);
        try {
            const trip = await updateTrip(tripId, { availabilityDeadline: iso });
            setAvailabilityDeadline(trip.availabilityDeadline);
            setDeadlineInput(toDateTimeLocal(trip.availabilityDeadline));
            toast.success('Availability deadline updated.');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to update deadline'));
        } finally {
            setSavingDeadline(false);
        }
    }

    if (loading) return <PageLoader />;

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">When are you free?</h1>
                <div className="flex items-center gap-2">
                    {status !== 'opted_out' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setOptOutOpen(true)}
                        >
                            <UserX className="size-4" />
                            <span className="hidden sm:inline">Opt out</span>
                        </Button>
                    )}
                    <Link
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                        to={`/trips/${tripId}`}
                    >
                        <ArrowLeft className="size-4" />
                        Back
                    </Link>
                </div>
            </div>
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {status === 'opted_out' ? (
                <Alert className="mb-4">
                    <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            You&apos;ve opted out of this trip. The group can see you&apos;re not
                            joining, and scheduling proceeds without you.
                        </span>
                        <Button variant="outline" size="sm" onClick={handleRejoin}>
                            Rejoin trip
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : (
                <p className="mb-4 text-sm text-muted-foreground">
                    Tap or drag to mark your available dates. Colors show group overlap. Changes save
                    automatically when you finish.
                    {saving && <span className="ml-2 text-foreground">Saving…</span>}
                </p>
            )}
            <Card className="mb-4">
                <CardContent className="pt-5">
                    <div className="flex items-center gap-2">
                        <CalendarClock className="size-4 text-muted-foreground" />
                        <span className="font-semibold">Availability deadline</span>
                    </div>
                    <p className="mt-1 text-sm">
                        <DeadlineBadge deadline={availabilityDeadline} label="Availability" />
                    </p>
                    {isHost && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                                type="datetime-local"
                                value={deadlineInput}
                                onChange={(e) => setDeadlineInput(e.target.value)}
                                className="sm:max-w-xs"
                                aria-label="Availability deadline"
                            />
                            <Button
                                variant="outline"
                                onClick={handleSaveDeadline}
                                disabled={savingDeadline}
                            >
                                {savingDeadline ? 'Saving…' : 'Save deadline'}
                            </Button>
                        </div>
                    )}
                    {isHost && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            Must be on or after the voting deadline
                            {votingDeadline
                                ? ` (${formatDeadline(votingDeadline)})`
                                : ' (none set)'}
                            .
                        </p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="mb-4 flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
                            disabled={monthOffset === 0}
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm font-medium text-muted-foreground">
                            Navigate up to {MAX_MONTHS_FORWARD} months ahead
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                                setMonthOffset((o) => Math.min(MAX_MONTHS_FORWARD, o + 1))
                            }
                            disabled={monthOffset >= MAX_MONTHS_FORWARD}
                            aria-label="Next month"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                    <CalendarGrid
                        year={year}
                        monthIndex={monthIndex}
                        heatmap={heatmap}
                        myDates={myDates}
                        totalMembers={memberCount}
                        onPointerDown={handlePointerDown}
                        onPointerEnter={handlePointerEnter}
                    />
                </CardContent>
            </Card>

            <Card className="mt-4">
                <CardContent className="pt-5">
                    <button
                        type="button"
                        className="flex w-full items-center justify-between text-left"
                        onClick={() => setSummaryOpen((v) => !v)}
                        aria-expanded={summaryOpen}
                    >
                        <span className="font-semibold">Best dates for your group</span>
                        <ChevronDown
                            className={cn(
                                'size-4 text-muted-foreground transition-transform',
                                summaryOpen && 'rotate-180'
                            )}
                        />
                    </button>
                    {summaryOpen && (
                        <div className="mt-3 space-y-1.5">
                            {summary.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No availability marked yet.
                                </p>
                            ) : (
                                summary.map((entry) => (
                                    <Tooltip
                                        key={entry.date}
                                        content={entry.members.map((m) => m.name).join(', ')}
                                        className="flex w-full"
                                    >
                                        <span className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-1.5 text-sm">
                                            <span className="font-medium">
                                                {formatDeadline(`${entry.date}T00:00`)?.replace(
                                                    / at .*/,
                                                    ''
                                                ) ?? entry.date}
                                            </span>
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Users className="size-3.5" />
                                                {entry.members.length} / {memberCount} members
                                                available
                                            </span>
                                        </span>
                                    </Tooltip>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            <ConfirmDialog
                open={optOutOpen}
                onOpenChange={setOptOutOpen}
                title="Opt out of this trip?"
                description="You'll be marked as not joining so the group can plan without you. You can rejoin anytime by marking your availability again."
                confirmLabel={optingOut ? 'Opting out…' : 'Opt out'}
                onConfirm={handleOptOut}
            />
        </div>
    );
}
