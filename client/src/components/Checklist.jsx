import { useState } from 'react';
import TaskRow from './TaskRow.jsx';

// checklist: [{ id, label, completedByMe, completedByCount }]
export default function Checklist({ checklist, currentUserId, creatorId, onToggle, onAdd, onDelete }) {
  const [label, setLabel] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!label.trim()) return;
    await onAdd(label.trim());
    setLabel('');
  }

  return (
    <div>
      <h3 className="h6 mt-3">Checklist</h3>
      {checklist.length === 0 && <p className="text-muted small">No tasks yet.</p>}
      <ul className="list-group mb-3">
        {checklist.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onToggle={onToggle}
            onDelete={onDelete}
            canDelete={String(t.createdBy) === String(currentUserId) || String(creatorId) === String(currentUserId)}
          />
        ))}
      </ul>
      <form onSubmit={handleAdd} className="input-group input-group-sm">
        <input
          className="form-control"
          placeholder="Add task…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button className="btn btn-outline-primary">Add</button>
      </form>
    </div>
  );
}
