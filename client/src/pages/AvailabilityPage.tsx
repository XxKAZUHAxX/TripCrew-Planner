import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Heatmap } from '@tripcrew/shared';
import { getMyAvailability, saveAvailability, getHeatmap } from '@/api/availability.api';
import { getErrorMessage } from '@/utils/errors';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import CalendarGrid from '@/components/CalendarGrid';

type DragMode = 'add' | 'remove';

interface MonthRef {
    year: number;
    monthIndex: number;
}

function buildMonthRange(): MonthRef[] {
    const now = new Date();
    const months: MonthRef[] = [];
    for (let i = 0; i < 3; i++) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
        months.push({ year: d.getUTCFullYear(), monthIndex: d.getUTCMonth() });
    }
    return months;
}

export default function AvailabilityPage() {
    const { tripId } = useParams() as { tripId: string };
    const [myDates, setMyDates] = useState<Set<string>>(new Set());
    const [heatmap, setHeatmap] = useState<Heatmap>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const dragRef = useRef<{ active: boolean; mode: DragMode }>({ active: false, mode: 'add' });
    const months = buildMonthRange();

    const loadData = useCallback(async () => {
        try {
            const [dates, heat] = await Promise.all([
                getMyAvailability(tripId),
                getHeatmap(tripId),
            ]);
            setMyDates(new Set(dates));
            setHeatmap(heat);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load availability'));
        } finally {
            setLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Lift mouseup globally so dragging outside the grid still ends the drag.
    useEffect(() => {
        function onMouseUp() {
            if (dragRef.current.active) {
                dragRef.current.active = false;
                handleSave();
            }
        }
        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, [myDates]);

    function handleMouseDown(key: string) {
        const mode: DragMode = myDates.has(key) ? 'remove' : 'add';
        dragRef.current = { active: true, mode };
        applyMode(key, mode);
    }

    function handleMouseEnter(key: string) {
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
        setSaved(false);
        try {
            await saveAvailability(tripId, [...myDates].sort());
            setHeatmap(await getHeatmap(tripId));
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to save'));
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
                Click or drag to mark your available dates. Colors show group overlap. Changes save
                automatically on mouse release.
                {saving && <span className="ml-2 text-foreground">Saving…</span>}
                {saved && <span className="ml-2 text-success">Saved!</span>}
            </p>
            <Card>
                <CardContent className="pt-6">
                    {months.map(({ year, monthIndex }) => (
                        <CalendarGrid
                            key={`${year}-${monthIndex}`}
                            year={year}
                            monthIndex={monthIndex}
                            heatmap={heatmap}
                            myDates={myDates}
                            onMouseDown={handleMouseDown}
                            onMouseEnter={handleMouseEnter}
                        />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
