import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Users } from 'lucide-react';
import type { AvailabilitySummaryEntry, Heatmap } from '@tripcrew/shared';
import {
    getMyAvailability,
    saveAvailability,
    getHeatmap,
    getAvailabilitySummary,
} from '@/api/availability.api';
import { getErrorMessage } from '@/utils/errors';
import { formatDeadline } from '@/utils/deadline';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import CalendarGrid from '@/components/CalendarGrid';

type DragMode = 'add' | 'remove';

// Allow navigating from the current month up to this many months forward.
const MAX_MONTHS_FORWARD = 6;

function monthRefFromOffset(offset: number): { year: number; monthIndex: number } {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    return { year: d.getUTCFullYear(), monthIndex: d.getUTCMonth() };
}

export default function AvailabilityPage() {
    const { tripId } = useParams() as { tripId: string };
    const [myDates, setMyDates] = useState<Set<string>>(new Set());
    const [heatmap, setHeatmap] = useState<Heatmap>({});
    const [summary, setSummary] = useState<AvailabilitySummaryEntry[]>([]);
    const [memberCount, setMemberCount] = useState(0);
    const [monthOffset, setMonthOffset] = useState(0);
    const [summaryOpen, setSummaryOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            const [dates] = await Promise.all([getMyAvailability(tripId), refreshGroupData()]);
            setMyDates(new Set(dates));
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load availability'));
        } finally {
            setLoading(false);
        }
    }, [tripId, refreshGroupData]);

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

    if (loading) return <PageLoader />;

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">When are you free?</h1>
                <Link
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    to={`/trips/${tripId}`}
                >
                    <ArrowLeft className="size-4" />
                    Back
                </Link>
            </div>
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <p className="mb-4 text-sm text-muted-foreground">
                Tap or drag to mark your available dates. Colors show group overlap. Changes save
                automatically when you finish.
                {saving && <span className="ml-2 text-foreground">Saving…</span>}
            </p>
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
        </div>
    );
}
