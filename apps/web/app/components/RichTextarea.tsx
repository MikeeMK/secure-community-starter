'use client';

import React, { useEffect, useRef, useState } from 'react';
import { renderRichText } from '../lib/markdown';

const EMOJIS = [
  '😊', '😍', '🔥', '❤️', '💬', '✨', '😂', '🥰', '😎', '🤔',
  '👀', '💭', '🎉', '🙏', '💪', '🌹', '😘', '😗', '🤭', '😉',
  '🫶', '🍕', '🌴', '🎭', '💦', '🧊', '😈', '📸', '🌟', '⚡',
  '🤗', '🤩', '🥳', '😇', '🤤', '😜', '😤', '🤯', '😴', '🤮',
  '🤒', '🤧', '🥶', '🥵', '🤢', '🤓', '🤠', '👻', '💀', '👽',
  '🐱', '🐶', '🐼', '🐧', '🐸', '🦄', '🐢', '🦋', '🍀', '🍓',
  '🍔', '🍣', '🍰', '🍿', '☕', '🍺', '🍷', '🥂', '🏆', '⚽',
  '🎸', '🥁', '🎧', '🎬', '✈️', '🚗', '🚲', '🏖️', '🌋', '🌌',
];

const RECENT_KEY = 'richtextarea_recent_emojis';

type ToolbarAction = {
  key: 'bold' | 'italic';
  label: string;
  title: string;
};

const ACTIONS: ToolbarAction[] = [
  { key: 'bold', label: 'B', title: 'Gras' },
  { key: 'italic', label: 'I', title: 'Italique' },
];

function getSelectionRange(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const startInside = root.contains(range.startContainer);
  const endInside = root.contains(range.endContainer);

  return startInside && endInside ? range : null;
}

function placeCaretAtEnd(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);

  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
}

function escapeTextContent(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeTextContent(node.textContent?.replace(/\u00a0/g, ' ') ?? '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tag = element.tagName;

  if (tag === 'BR') {
    return '\n';
  }

  const childContent = Array.from(element.childNodes).map(serializeNode).join('');

  if (tag === 'STRONG' || tag === 'B') {
    return `<strong>${childContent}</strong>`;
  }

  if (tag === 'EM' || tag === 'I') {
    return `<em>${childContent}</em>`;
  }

  if (tag === 'DIV' || tag === 'P') {
    return `${childContent}${childContent.endsWith('<br>') || childContent.length === 0 ? '' : '<br>'}`;
  }

  return childContent;
}

function serializeEditor(root: HTMLElement) {
  return Array.from(root.childNodes)
    .map(serializeNode)
    .join('')
    .replace(/(?:<br>){3,}/g, '<br><br>')
    .trimEnd();
}

function insertEmojiAtSelection(root: HTMLElement, emoji: string) {
  const range = getSelectionRange(root);
  if (!range) {
    root.focus();
    placeCaretAtEnd(root);
    return insertEmojiAtSelection(root, emoji);
  }

  range.deleteContents();
  const textNode = document.createTextNode(emoji);
  range.insertNode(textNode);

  const nextRange = document.createRange();
  nextRange.setStartAfter(textNode);
  nextRange.collapse(true);

  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(nextRange);
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
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(RECENT_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as string[];
      setRecentEmojis(parsed.slice(0, 12));
    } catch {
      setRecentEmojis([]);
    }
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentValue = serializeEditor(editor);
    if (currentValue === value) return;

    editor.innerHTML = value ? renderRichText(value) : '';
  }, [value]);

  function pushRecent(emoji: string) {
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((entry) => entry !== emoji)].slice(0, 12);
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      }
      return next;
    });
  }

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(serializeEditor(editor));
  }

  function handleFormat(action: ToolbarAction['key']) {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(action === 'bold' ? 'bold' : 'italic');
    emitChange();
  }

  function handleEmojiInsert(emoji: string) {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    insertEmojiAtSelection(editor, emoji);
    pushRecent(emoji);
    setShowEmoji(false);
    emitChange();
  }

  const minHeight = rows * 24;
  const isEmpty = value.trim().length === 0;

  return (
    <div
      style={{
        position: 'relative',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        background: 'var(--bg-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '6px 8px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            title={action.title}
            onMouseDown={(event) => {
              event.preventDefault();
              handleFormat(action.key);
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
              fontSize: action.key === 'bold' ? 13 : 12,
              fontWeight: action.key === 'bold' ? 900 : 400,
              fontStyle: action.key === 'italic' ? 'italic' : 'normal',
              fontFamily: 'inherit',
              color: 'var(--text)',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = 'var(--surface-3)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'none';
            }}
          >
            {action.label}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="Emoji"
            onClick={() => setShowEmoji((prev) => !prev)}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid transparent',
              borderRadius: 4,
              background: showEmoji ? 'var(--surface-3)' : 'none',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            😊
          </button>

          {showEmoji && (
            <div
              style={{
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
              }}
            >
              {(recentEmojis.length === 0 || showAllEmojis) && (
                <>
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiInsert(emoji)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: 20,
                        padding: 6,
                        borderRadius: 6,
                        lineHeight: 1,
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background = 'var(--surface-3)';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = 'none';
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </>
              )}

              {recentEmojis.length > 0 && !showAllEmojis && (
                recentEmojis.map((emoji) => (
                  <button
                    key={`recent-${emoji}`}
                    type="button"
                    onClick={() => handleEmojiInsert(emoji)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: 20,
                      padding: 6,
                      borderRadius: 6,
                      lineHeight: 1,
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = 'var(--surface-3)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'none';
                    }}
                  >
                    {emoji}
                  </button>
                ))
              )}

              {recentEmojis.length > 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => setShowAllEmojis((prev) => !prev)}
                    style={{ width: '100%' }}
                  >
                    {showAllEmojis ? 'Masquer le reste' : 'Voir tous les emojis'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {isEmpty && !isFocused && placeholder && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              color: 'var(--text-dim)',
              fontSize: 15,
              lineHeight: 1.6,
              pointerEvents: 'none',
            }}
          >
            {placeholder}
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={emitChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setShowEmoji(false);
          }}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
              event.preventDefault();
              handleFormat('bold');
            }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
              event.preventDefault();
              handleFormat('italic');
            }
          }}
          style={{
            minHeight,
            padding: '12px',
            color: 'var(--text)',
            fontSize: 15,
            lineHeight: 1.6,
            outline: 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        />
      </div>

      <div
        style={{
          padding: '4px 10px',
          fontSize: 11,
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        {value.length} / 5000 caractères
      </div>
    </div>
  );
}
