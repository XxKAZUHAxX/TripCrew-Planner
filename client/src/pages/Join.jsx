import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinTrip } from '../api/trips.api.js';

export default function Join() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  async function handleJoin() {
    setError(null);
    setJoining(true);
    try {
      const trip = await joinTrip(inviteCode);
      navigate(`/trips/${trip._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join trip');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="container py-5 text-center">
      <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: 480 }}>
        <h1 className="h4">Join a trip</h1>
        <p className="text-muted">
          You were invited with code <code>{inviteCode}</code>.
        </p>
        {error && <div className="alert alert-danger">{error}</div>}
        <button className="btn btn-primary" onClick={handleJoin} disabled={joining}>
          {joining ? 'Joining…' : 'Join this trip'}
        </button>
      </div>
    </div>
  );
}
