import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Renders user-authored Markdown safely. Raw HTML is NEVER injected
// without going through DOMPurify, preventing stored XSS from
// the instructions field. (Domain Rule: Markdown safety.)
export default function SafeMarkdown({ content }) {
  const sanitized = useMemo(() => {
    if (!content) return '';
    const raw = marked.parse(content);
    return DOMPurify.sanitize(raw);
  }, [content]);

  if (!sanitized) {
    return <p className="text-muted fst-italic">No instructions yet.</p>;
  }

  return (
    <div
      className="markdown-body"
      // Safe: sanitized by DOMPurify immediately above.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
