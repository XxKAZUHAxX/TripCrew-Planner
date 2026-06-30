import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface SafeMarkdownProps {
    content: string | undefined;
}

// Renders user-authored Markdown safely. Raw HTML is NEVER injected
// without going through DOMPurify, preventing stored XSS from
// the instructions field. (Domain Rule: Markdown safety.)
export default function SafeMarkdown({ content }: SafeMarkdownProps) {
    const sanitized = useMemo(() => {
        if (!content) return '';
        const raw = marked.parse(content) as string;
        return DOMPurify.sanitize(raw);
    }, [content]);

    if (!sanitized) {
        return <p className="text-sm italic text-muted-foreground">No instructions yet.</p>;
    }

    return (
        <div
            className="markdown-body"
            // Safe: sanitized by DOMPurify immediately above.
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    );
}
