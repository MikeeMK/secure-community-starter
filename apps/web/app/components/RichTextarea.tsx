'use client';

import React, { useEffect, useRef, useState } from 'react';
import { renderMarkdown } from '../lib/markdown';

const EMOJIS = [
  '😊','😍','🔥','❤️','💬','✨','😂','🥰','😎','🤔',
  '👀','💭','🎉','🙏','💪','🌹','😘','😗','🤭','😉',
  '🫶','🍕','🌴','🎭','💦','🧊','😈','📸','🌟','⚡',
  '🤗','🤩','🥳','😇','🤤','😜','😤','🤯','😴','🤮',
  '🤒','🤧','🥶','🥵','🤢','🤓','🤠','👻','💀','👽',
  '🐱','🐶','🐼','🐧','🐸','🦄','🐢','🦋','🍀','🍓',
  '🍔','🍣','🍰','🍿','☕','🍺','🍷','🥂','🏆','⚽',
  '🎸','🥁','🎧','🎬','✈️','🚗','🚲','🏖️','🌋','🌌',
];

const RECENT_KEY = 'richtextarea_recent_emojis';

type ToolbarAction = { label: string; title: string; wrap?: [string, string]; icon: string };

const ACTIONS: ToolbarAction[] = [
  { icon: 'B', label: 'B', title: 'Gras', wrap: ['**', '**'] },
  { icon: 'I', label: 'I', title: 'Italique', wrap: ['*', '*'] },
  { icon: '<>', label: '<>', title: 'Code', wrap: ['`', '`'] },
];

  function applyWrap(
    textarea: HTMLTextAreaElement,
    open: string,
    close: string,
    onChange: (v: string) => void,
  ) {
    const { selectionStart: s, selectionEnd: e, value } = textarea;
    const safeS = s ?? 0;
    const safeE = e ?? safeS;
    const selected = value.slice(safeS, safeE) || 'texte';
    const newVal = value.slice(0, safeS) + open + selected + close + value.slice(safeE);
    onChange(newVal);
    requestAnimationFrame(() => {
      textarea.focus();
      const start = safeS + open.length;
      textarea.setSelectionRange(start, start + selected.length);
    });
  }

export function RichTextarea({
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState<number | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(44);
  const [counterHeight, setCounterHeight] = useState(28);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [showAllEmojis, setShowAllEmojis] = useState(false);

  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const next = Math.min(Math.max(ta.scrollHeight, rows * 24), 600);
    ta.style.height = `${next}px`;
    setOverlayHeight(next);
  }, [value, rows]);

  useEffect(() => {
    const measure = () => {
      if (toolbarRef.current) setToolbarHeight(toolbarRef.current.getBoundingClientRect().height);
      if (counterRef.current) setCounterHeight(counterRef.current.getBoundingClientRect().height);
    };
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [value, showEmoji]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setRecentEmojis(parsed.slice(0, 12));
      } catch {}
    }
  }, []);

  function pushRecent(emoji: string) {
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 12);
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      }
      return next;
    });
  }

  function insertEmoji(emoji: string) {
    const ta = ref.current;
    if (!ta) { onChange(value + emoji); return; }
    const s = ta.selectionStart ?? value.length;
    const e = ta.selectionEnd ?? value.length;
    const newVal = value.slice(0, s) + emoji + value.slice(e);
    onChange(newVal);
    pushRecent(emoji);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
    setShowEmoji(false);
  }

  return (
    <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-card)' }}>
      {/* Toolbar */}
      <div
        ref={toolbarRef}
        style={{
        display: 'flex',
        gap: 2,
        padding: '6px 8px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            title={a.title}
            onMouseDown={(e) => {
              e.preventDefault();
              if (ref.current && a.wrap) applyWrap(ref.current, a.wrap[0], a.wrap[1], onChange);
            }}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid transparent',
              borderRadius: 4,
              background: 'none',
              cursor: 'pointer',
              fontSize: a.label === 'B' ? 13 : 12,
              fontWeight: a.label === 'B' ? 900 : a.label === 'I' ? 400 : 700,
              fontStyle: a.label === 'I' ? 'italic' : 'normal',
              fontFamily: a.label === '<>' ? 'monospace' : 'inherit',
              color: 'var(--text)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            {a.icon}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        {/* Emoji picker button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="Emoji"
            onClick={() => setShowEmoji((v) => !v)}
            style={{
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid transparent', borderRadius: 4,
              background: showEmoji ? 'var(--surface-3)' : 'none',
              cursor: 'pointer', fontSize: 16,
            }}
          >
            😊
          </button>
          {showEmoji && (
            <div style={{
              position: 'absolute',
              top: 34,
              left: 0,
              zIndex: 50,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 8,
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 6,
              width: 240,
              maxHeight: 260,
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
            }}>
              {(recentEmojis.length === 0 || showAllEmojis) && (
                <>
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => insertEmoji(em)}
                      style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: 20, padding: 6, borderRadius: 6,
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      {em}
                    </button>
                  ))}
                </>
              )}

              {recentEmojis.length > 0 && !showAllEmojis && (
                recentEmojis.map((em) => (
                  <button
                    key={`recent-${em}`}
                    type="button"
                    onClick={() => insertEmoji(em)}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: 20, padding: 6, borderRadius: 6,
                      lineHeight: 1,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    {em}
                  </button>
                ))
              )}

              {recentEmojis.length > 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => setShowAllEmojis((v) => !v)}
                    style={{ width: '100%' }}
                  >
                    {showAllEmojis ? 'Masquer le reste' : 'Voir tous les emojis'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)' }}>
          **gras**, *italique*, `code`
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={ref}
        className="form-input rich-textarea-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        style={{
          resize: 'none',
          fontFamily: 'inherit',
          border: 'none',
          borderRadius: 0,
          background: 'transparent',
          minHeight: rows * 22,
          color: 'transparent',
          caretColor: 'var(--text)',
          position: 'relative',
          zIndex: 2,
          padding: '12px',
          lineHeight: 1.6,
          fontSize: 15,
        }}
        onClick={() => setShowEmoji(false)}
      />

      {/* Rendered overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: toolbarHeight,
          left: 0,
          right: 0,
          bottom: counterHeight,
          padding: '12px',
          pointerEvents: 'none',
          color: 'var(--text)',
          fontSize: '14px',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
          zIndex: 1,
          minHeight: overlayHeight ?? rows * 22,
        }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(value || '') }}
      />

      <div
        ref={counterRef}
        style={{ padding: '4px 10px', fontSize: 11, color: 'var(--text-dim)', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}
      >
        {value.length} / 5000 caractères
      </div>
    </div>
  );
}
