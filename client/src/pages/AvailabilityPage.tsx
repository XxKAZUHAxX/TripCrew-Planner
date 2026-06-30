import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Heatmap } from '@tripcrew/shared';
import { getMyAvailability, saveAvailability, getHeatmap } from '../api/availability.api';
import { getErrorMessage } from '../utils/errors';
import CalendarGrid from '../components/CalendarGrid';

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

    // Drag state: { active, mode: 'add'|'remove' }
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
            const heat = await getHeatmap(tripId);
            setHeatmap(heat);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to save'));
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="container py-5">Loading…</div>;

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="h3 mb-0">When are you free?</h1>
                <Link className="btn btn-outline-secondary btn-sm" to={`/trips/${tripId}`}>
                    ← Back
                </Link>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <p className="text-muted small">
                Click or drag to mark your available dates. Colors show group overlap. Changes save
                automatically on mouse release.
            </p>
            {saving && <p className="text-muted small">Saving…</p>}
            {saved && <p className="text-success small">Saved!</p>}
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
        </div>
    );
}
