import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWheelStatus, spinWheel } from '../api/wheel.api.js';
import { getTrip } from '../api/trips.api.js';
import { useAuth } from '../hooks/useAuth.js';
import WheelCanvas from '../components/WheelCanvas.jsx';
import WinnerBanner from '../components/WinnerBanner.jsx';
import ChaosButton from '../components/ChaosButton.jsx';

// phases: 'idle' → 'spinning' → 'landed' → 'finalized'
export default function WheelPage() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [slices, setSlices] = useState([]);
  const [eligible, setEligible] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [status, detail] = await Promise.all([getWheelStatus(tripId), getTrip(tripId)]);
        if (!active) return;
        setSlices(status.slices || []);
        setEligible(status.eligible);
        const creatorId = detail.trip.creator?._id || detail.trip.creator;
        setIsCreator(String(creatorId) === String(user?.id));
        if (detail.trip.status !== 'voting') {
          setPhase('finalized');
          setWinner(detail.trip.winningDestination);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [tripId, user?.id]);

  // Server picks the winner first; we animate to the returned index.
  async function handleSpin() {
    setError(null);
    setPhase('spinning');
    try {
      const result = await spinWheel(tripId);
      setWinnerIndex(result.winnerIndex);
      setWinner(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Spin failed');
      setPhase('idle');
    }
  }

  function handleSpinEnd() {
    setPhase('landed');
    setTimeout(() => setPhase('finalized'), 800);
  }

  if (loading) return <div className="container py-5">Loading…</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Wheel of Destiny</h1>
        <Link className="btn btn-outline-secondary btn-sm" to={`/trips/${tripId}`}>
          ← Back
        </Link>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      {slices.length > 0 ? (
        <WheelCanvas
          slices={slices}
          winnerIndex={winnerIndex}
          spinning={phase === 'spinning'}
          onSpinEnd={handleSpinEnd}
        />
      ) : (
        <p className="text-muted text-center">No destinations to show on the wheel yet.</p>
      )}

      <ChaosButton
        eligible={eligible}
        isCreator={isCreator}
        onSpin={handleSpin}
        spinning={phase === 'spinning'}
      />

      {phase === 'finalized' && winner && (
        <WinnerBanner
          destination={
            typeof winner === 'object' && winner.name
              ? winner
              : slices.find((s) => s.destId === winner.winningDestinationId)
          }
          onClose={() => navigate(`/trips/${tripId}/playbook`)}
        />
      )}
    </div>
  );
}
