import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getPlaybook,
  updateInstructions,
  addTask,
  toggleTask,
  deleteTask,
} from '../api/playbook.api.js';
import { getTrip } from '../api/trips.api.js';
import { useAuth } from '../hooks/useAuth.js';
import SafeMarkdown from '../components/SafeMarkdown.jsx';
import MarkdownEditor from '../components/MarkdownEditor.jsx';
import Checklist from '../components/Checklist.jsx';

export default function PlaybookPage() {
  const { tripId } = useParams();
  const { user } = useAuth();

  const [instructions, setInstructions] = useState('');
  const [winningDest, setWinningDest] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorId, setCreatorId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [pb, detail] = await Promise.all([getPlaybook(tripId), getTrip(tripId)]);
      setInstructions(pb.instructions);
      setWinningDest(pb.winningDestination);
      setChecklist(pb.checklist);
      const cId = detail.trip.creator?._id || detail.trip.creator;
      setCreatorId(cId);
      setIsCreator(String(cId) === String(user?.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load playbook');
    } finally {
      setLoading(false);
    }
  }, [tripId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveInstructions(value) {
    await updateInstructions(tripId, value);
    setInstructions(value);
    setEditing(false);
  }

  async function handleAddTask(label) {
    await addTask(tripId, label);
    await load();
  }

  async function handleToggle(taskId) {
    await toggleTask(tripId, taskId);
    await load();
  }

  async function handleDelete(taskId) {
    await deleteTask(tripId, taskId);
    await load();
  }

  if (loading) return <div className="container py-5">Loading…</div>;
  if (error)
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to={`/trips/${tripId}`}>← Back to dashboard</Link>
      </div>
    );

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Trip Playbook</h1>
        <Link className="btn btn-outline-secondary btn-sm" to={`/trips/${tripId}`}>
          ← Back
        </Link>
      </div>

      {winningDest && (
        <div className="alert alert-success">
          🏆 Destination decided: <strong>{winningDest.name}</strong>
        </div>
      )}

      <div className="card p-3 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h5 mb-0">Instructions</h2>
          {isCreator && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? 'Preview' : 'Edit'}
            </button>
          )}
        </div>
        {isCreator && editing ? (
          <MarkdownEditor instructions={instructions} onSave={handleSaveInstructions} />
        ) : (
          <SafeMarkdown content={instructions} />
        )}
      </div>

      <div className="card p-3 shadow-sm">
        <Checklist
          checklist={checklist}
          currentUserId={user?.id}
          creatorId={creatorId}
          onToggle={handleToggle}
          onAdd={handleAddTask}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
