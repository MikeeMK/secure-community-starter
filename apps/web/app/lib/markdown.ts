/**
 * Minimal Markdown renderer — supports:
 * **bold**, *italic*, `code`, line breaks
 * No external deps, safe (escapes HTML before rendering).
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderMarkdown(text: string): string {
  const escaped = escapeHtml(text);

  // Code spans first
  const withCode = escaped.replace(
    /`([^`]+)`/g,
    '<code style="font-family:monospace;background:var(--surface-3);padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>',
  );

  // Bold **text**
  const withBold = withCode.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *text* (single * only)
  const withItalic = withBold.replace(/(^|[^*])\*(?!\*)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');

  // Line breaks
  return withItalic.replace(/\n/g, '<br>');
}
