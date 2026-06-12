import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyVote, submitVote, getTally } from '../api/votes.api.js';
import { listDestinations } from '../api/destinations.api.js';
import RankableList from '../components/RankableList.jsx';
import ScoreBoard from '../components/ScoreBoard.jsx';

export default function VotePage() {
  const { tripId } = useParams();
  const [destinations, setDestinations] = useState([]);
  const [rankedIds, setRankedIds] = useState([]);
  const [scores, setScores] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [dests, myVote, tally] = await Promise.all([
          listDestinations(tripId),
          getMyVote(tripId),
          getTally(tripId),
        ]);
        if (!active) return;
        setDestinations(dests);
        setRankedIds(myVote?.ranking || []);
        setScores(tally);
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
  }, [tripId]);

  const destMap = Object.fromEntries(destinations.map((d) => [d._id, d]));
  const ranked = rankedIds.map((id) => destMap[id]).filter(Boolean);
  const unranked = destinations.filter((d) => !rankedIds.includes(d._id));

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await submitVote(tripId, rankedIds);
      const tally = await getTally(tripId);
      setScores(tally);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vote');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container py-5">Loading…</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Cast your vote</h1>
        <Link className="btn btn-outline-secondary btn-sm" to={`/trips/${tripId}`}>
          ← Back
        </Link>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-4">
        <div className="col-md-7">
          {destinations.length === 0 ? (
            <p className="text-muted">No destinations to rank yet.</p>
          ) : (
            <RankableList
              ranked={ranked}
              unranked={unranked}
              onRankingChange={setRankedIds}
            />
          )}
          <div className="mt-3">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save vote'}
            </button>
            {saved && <span className="text-success ms-3">Vote saved!</span>}
          </div>
        </div>
        <div className="col-md-5">
          <ScoreBoard scores={scores} />
          <p className="text-muted small mt-2">
            Scores update after you save. Others' scores reflect their saved votes.
          </p>
        </div>
      </div>
    </div>
  );
}
