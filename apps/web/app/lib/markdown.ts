/**
 * Minimal Markdown renderer — supports:
 * **bold**, *italic*, line breaks
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

  // Bold **text**
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *text* (single * only)
  const withItalic = withBold.replace(/(^|[^*])\*(?!\*)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');

  // Line breaks
  return withItalic.replace(/\n/g, '<br>');
}

function unescapeAllowedTags(text: string) {
  return text
    .replace(/&lt;(\/)?strong&gt;/g, '<$1strong>')
    .replace(/&lt;(\/)?em&gt;/g, '<$1em>')
    .replace(/&lt;br\s*\/?&gt;/g, '<br>');
}

export function renderRichText(text: string): string {
  if (/<\/?(strong|em)\s*>|<br\s*\/?>/i.test(text)) {
    return unescapeAllowedTags(escapeHtml(text)).replace(/\n/g, '<br>');
  }

  return renderMarkdown(text);
}

export function toPlainTextPreview(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(strong|em)\s*>/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*])\*(?!\*)([^*]+?)\*(?!\*)/g, '$1$2')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
