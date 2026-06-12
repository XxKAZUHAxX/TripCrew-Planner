import { useState } from 'react';

// Only rendered for the trip creator.
export default function MarkdownEditor({ instructions, onSave }) {
  const [value, setValue] = useState(instructions || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="form-label fw-semibold">Instructions (Markdown)</label>
      <textarea
        className="form-control font-monospace"
        rows={8}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="# Meeting point&#10;Lobby at 9am…"
      />
      <button
        className="btn btn-primary btn-sm mt-2"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save instructions'}
      </button>
    </div>
  );
}
