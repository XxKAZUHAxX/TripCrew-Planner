import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps {
    instructions: string;
    onSave: (value: string) => void | Promise<void>;
}

// Only rendered for the trip creator.
export default function MarkdownEditor({ instructions, onSave }: MarkdownEditorProps) {
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
        <div className="space-y-2">
            <Label htmlFor="instructions">Instructions (Markdown)</Label>
            <Textarea
                id="instructions"
                rows={8}
                className="font-mono"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="# Meeting point&#10;Lobby at 9am…"
            />
            <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save instructions'}
            </Button>
        </div>
    );
}
