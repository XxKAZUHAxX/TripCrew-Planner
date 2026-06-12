import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrip, getDashboard, toggleInvite } from '../api/trips.api.js';
import { proposeDestination, deleteDestination } from '../api/destinations.api.js';
import { useAuth } from '../hooks/useAuth.js';
import MembersList from '../components/MembersList.jsx';
import DestinationList from '../components/DestinationList.jsx';
import ScoreBoard from '../components/ScoreBoard.jsx';

export default function TripDashboard() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [detail, dash] = await Promise.all([getTrip(tripId), getDashboard(tripId)]);
      setTrip(detail.trip);
      setMembers(detail.members);
      setDestinations(detail.destinations);
      setDashboard(dash);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePropose(payload) {
    await proposeDestination(tripId, payload);
    await load();
  }

  async function handleDelete(id) {
    await deleteDestination(tripId, id);
    await load();
  }

  async function handleToggleInvite() {
    const updated = await toggleInvite(tripId, !trip.inviteActive);
    setTrip(updated);
  }

  function copyInvite() {
    const url = `${window.location.origin}/join/${trip.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) return <div className="container py-5">Loading…</div>;
  if (error) return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;

  const isCreator = trip.creator?._id === user?.id || trip.creator === user?.id;
  const creatorId = trip.creator?._id || trip.creator;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">{trip.title}</h1>
        <span className="badge bg-secondary text-uppercase">{trip.status}</span>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <Link className="btn btn-outline-primary btn-sm" to={`/trips/${tripId}/vote`}>
          Vote
        </Link>
        <Link className="btn btn-outline-primary btn-sm" to={`/trips/${tripId}/availability`}>
          Availability
        </Link>
        {dashboard?.deadlock?.eligible && trip.status === 'voting' && (
          <Link className="btn btn-warning btn-sm" to={`/trips/${tripId}/wheel`}>
            Wheel of Destiny
          </Link>
        )}
        {trip.status !== 'voting' && (
          <Link className="btn btn-success btn-sm" to={`/trips/${tripId}/playbook`}>
            Playbook
          </Link>
        )}
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <h2 className="h5">Members</h2>
          <MembersList
            members={members}
            creatorId={creatorId}
            badges={dashboard?.badges}
            definitions={dashboard?.definitions}
          />
          <div className="card p-3 mt-3 shadow-sm">
            <h3 className="h6">Invite link</h3>
            <div className="input-group input-group-sm mb-2">
              <input
                className="form-control"
                readOnly
                value={`${window.location.origin}/join/${trip.inviteCode}`}
              />
              <button className="btn btn-outline-secondary" onClick={copyInvite}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {isCreator && (
              <button
                className={`btn btn-sm ${trip.inviteActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                onClick={handleToggleInvite}
              >
                {trip.inviteActive ? 'Deactivate link' : 'Reactivate link'}
              </button>
            )}
          </div>
        </div>

        <div className="col-md-4">
          <h2 className="h5">Destinations</h2>
          <DestinationList
            destinations={destinations}
            currentUserId={user?.id}
            creatorId={creatorId}
            onPropose={handlePropose}
            onDelete={handleDelete}
          />
        </div>

        <div className="col-md-4">
          <ScoreBoard scores={dashboard?.scores || []} />
        </div>
      </div>
    </div>
  );
}
