'use client';

import React from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Category = 'Suggestion' | 'Bug' | 'Question';
type Sentiment = 'positive' | 'neutral' | 'frustrated' | 'angry';

const CATEGORIES: { id: Category; icon: string }[] = [
  { id: 'Suggestion', icon: '💡' },
  { id: 'Bug', icon: '🐛' },
  { id: 'Question', icon: '❓' },
];

const toastMessages: Record<Sentiment, string> = {
  positive: 'Merci pour votre retour !',
  neutral: 'Merci pour votre retour !',
  frustrated: 'On a bien noté, on s\'en occupe.',
  angry: 'Désolé pour ce désagrément, on regarde ça en priorité.',
};

const toastColors: Record<Sentiment, string> = {
  positive: 'var(--success)',
  neutral: 'var(--primary)',
  frustrated: 'var(--warning)',
  angry: 'var(--danger)',
};

export function FeedbackWidget() {
  const { estAuthentifie } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<Category>('Suggestion');
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; color: string } | null>(null);

  // Listen for open-feedback custom event (triggered from dashboard sidebar)
  React.useEffect(() => {
    function handler() { setOpen(true); }
    window.addEventListener('open-feedback', handler);
    return () => window.removeEventListener('open-feedback', handler);
  }, []);

  if (!estAuthentifie) return null;

  function showToast(sentiment: Sentiment) {
    setToast({ message: toastMessages[sentiment], color: toastColors[sentiment] });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length < 10) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ sentiment: Sentiment }>('/feedback', {
        method: 'POST',
        body: JSON.stringify({ content: `[${category}] ${content.trim()}` }),
      });
      setContent('');
      setOpen(false);
      showToast(res.sentiment ?? 'neutral');
    } catch {
      showToast('neutral');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: toast.color,
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.3s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast.message}
        </div>
      )}

      {/* Modal overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '28px 28px 24px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.24)',
              animation: 'slideUp 0.2s ease',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>Envoyer un feedback</span>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: 4 }}
              >
                ×
              </button>
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 16px',
                    borderRadius: 99,
                    border: `2px solid ${category === c.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: category === c.id ? 'var(--primary-glow)' : 'var(--bg-card)',
                    color: category === c.id ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: category === c.id ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 15 }}>{c.icon}</span>
                  {c.id}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Décrivez votre ${category.toLowerCase()}, bug ou question…`}
                rows={6}
                maxLength={2000}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-base)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  lineHeight: 1.6,
                  outline: 'none',
                }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {content.length} / 2000
                </span>
                <button
                  type="submit"
                  disabled={loading || content.trim().length < 10}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ fontSize: 15 }}>↗</span>
                  {loading ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
