import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyAvailability, saveAvailability, getHeatmap } from '../api/availability.api.js';
import CalendarGrid from '../components/CalendarGrid.jsx';

function buildMonthRange() {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    months.push({ year: d.getUTCFullYear(), monthIndex: d.getUTCMonth() });
  }
  return months;
}

export default function AvailabilityPage() {
  const { tripId } = useParams();
  const [myDates, setMyDates] = useState(new Set());
  const [heatmap, setHeatmap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Drag state: { active, mode: 'add'|'remove' }
  const dragRef = useRef({ active: false, mode: 'add' });

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
      setError(err.response?.data?.message || 'Failed to load availability');
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

  function handleMouseDown(key) {
    const mode = myDates.has(key) ? 'remove' : 'add';
    dragRef.current = { active: true, mode };
    applyMode(key, mode);
  }

  function handleMouseEnter(key) {
    if (!dragRef.current.active) return;
    applyMode(key, dragRef.current.mode);
  }

  function applyMode(key, mode) {
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
      setError(err.response?.data?.message || 'Failed to save');
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
        Click or drag to mark your available dates. Colors show group overlap.
        Changes save automatically on mouse release.
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
          dragState={dragRef.current}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
        />
      ))}
    </div>
  );
}
