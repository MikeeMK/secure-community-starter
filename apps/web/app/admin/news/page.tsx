'use client';

import React from 'react';
import { apiFetch } from '../../lib/api';

type NewsItem = {
  id: string;
  title: string;
  content: string;
  publishedAt: string | null;
  createdAt: string;
  author: { displayName: string };
  newsFeedbacks: { feedbackId: string }[];
};

type FeedbackItem = {
  id: string;
  content: string;
  aiAnalysis: { sentiment: string; category: string; summary: string; tags: string[] } | null;
  createdAt: string;
  user: { displayName: string };
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Éditeur de news ───────────────────────────────────────────────────────────

function EditeurNews({
  initial,
  onSave,
  onCancel,
}: {
  initial?: NewsItem;
  onSave: (data: NewsItem) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [content, setContent] = React.useState(initial?.content ?? '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = initial
        ? await apiFetch<NewsItem>(`/news/${initial.id}`, { method: 'PATCH', body: JSON.stringify({ title, content }) })
        : await apiFetch<NewsItem>('/news', { method: 'POST', body: JSON.stringify({ title, content }) });
      onSave(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
        {initial ? 'Modifier la news' : 'Nouvelle news'}
      </h2>
      <form onSubmit={handleSubmit} className="stack">
        <div className="form-group">
          <label className="form-label">Titre</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Nouvelle fonctionnalité de messagerie"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Contenu</label>
          <textarea
            className="form-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Décrivez la mise à jour..."
            required
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="row" style={{ gap: 8 }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Modal liaison feedbacks ───────────────────────────────────────────────────

function ModalLiaisonFeedbacks({
  news,
  onClose,
  onLinked,
}: {
  news: NewsItem;
  onClose: () => void;
  onLinked: (ids: string[]) => void;
}) {
  const [feedbacks, setFeedbacks] = React.useState<FeedbackItem[] | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(
    new Set(news.newsFeedbacks.map((nf) => nf.feedbackId))
  );
  const [suggesting, setSuggesting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<FeedbackItem[]>('/feedback').then(setFeedbacks).catch((e) => setError(String(e)));
  }, []);

  async function suggest() {
    setSuggesting(true);
    try {
      const ids = await apiFetch<string[]>(`/news/${news.id}/suggest-feedbacks`);
      setSelected(new Set(ids));
    } catch (e) {
      setError(String(e));
    } finally {
      setSuggesting(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await apiFetch(`/news/${news.id}/link-feedbacks`, {
        method: 'POST',
        body: JSON.stringify({ feedbackIds: [...selected] }),
      });
      onLinked([...selected]);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const sentimentColor: Record<string, string> = {
    positive: 'var(--success)',
    neutral: 'var(--text-muted)',
    frustrated: 'var(--warning)',
    angry: 'var(--danger)',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 640, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Lier des feedbacks</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>"{news.title}"</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={suggest}
              disabled={suggesting || !feedbacks}
            >
              {suggesting ? '…' : '✨ Suggestion IA'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
          {!feedbacks && <p className="loading-text">Chargement…</p>}
          {feedbacks && feedbacks.length === 0 && <p className="loading-text">Aucun feedback pour l'instant.</p>}
          {feedbacks && feedbacks.map((f) => (
            <label
              key={f.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 6,
                cursor: 'pointer',
                background: selected.has(f.id) ? 'var(--primary-glow)' : 'var(--surface-2)',
                border: `1px solid ${selected.has(f.id) ? 'var(--primary)' : 'transparent'}`,
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(f.id)}
                onChange={(e) => {
                  const next = new Set(selected);
                  e.target.checked ? next.add(f.id) : next.delete(f.id);
                  setSelected(next);
                }}
                style={{ marginTop: 2 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{f.user.displayName}</span>
                  {f.aiAnalysis && (
                    <span style={{ fontSize: 11, color: sentimentColor[f.aiAnalysis.sentiment] ?? 'inherit', fontWeight: 600 }}>
                      {f.aiAnalysis.sentiment}
                    </span>
                  )}
                  {f.aiAnalysis?.category && (
                    <span className="tag" style={{ fontSize: 10 }}>{f.aiAnalysis.category}</span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>{formaterDate(f.createdAt)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {f.aiAnalysis?.summary || f.content.slice(0, 120)}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.size} feedback{selected.size !== 1 ? 's' : ''} sélectionné{selected.size !== 1 ? 's' : ''}</span>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? 'Sauvegarde…' : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function PageAdminNews() {
  const [news, setNews] = React.useState<NewsItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<NewsItem | null | 'new'>(null);
  const [linking, setLinking] = React.useState<NewsItem | null>(null);
  const [publishing, setPublishing] = React.useState<string | null>(null);

  function refresh() {
    apiFetch<NewsItem[]>('/news').then(setNews).catch((e) => setError(String(e)));
  }

  React.useEffect(() => { refresh(); }, []);

  async function handlePublish(id: string) {
    setPublishing(id);
    try {
      await apiFetch(`/news/${id}/publish`, { method: 'POST' });
      refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setPublishing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette news ?')) return;
    try {
      await apiFetch(`/news/${id}`, { method: 'DELETE' });
      refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div>
      <div className="page-header row-between">
        <div>
          <h1 className="page-title">News & Changelog</h1>
          <p className="page-subtitle">Publiez des mises à jour et reliez-les aux feedbacks</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          + Nouvelle news
        </button>
      </div>

      {editing && (
        <EditeurNews
          initial={editing === 'new' ? undefined : editing}
          onSave={(saved) => {
            refresh();
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {linking && (
        <ModalLiaisonFeedbacks
          news={linking}
          onClose={() => setLinking(null)}
          onLinked={() => { refresh(); setLinking(null); }}
        />
      )}

      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}
      {!news && !error && <p className="loading-text">Chargement…</p>}

      {news && news.length === 0 && (
        <div className="card empty-state">
          <span className="empty-state-icon">📰</span>
          <p>Aucune news pour l'instant. Créez-en une !</p>
        </div>
      )}

      {news && news.map((n) => (
        <div key={n.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="row" style={{ gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{n.title}</span>
                {n.publishedAt ? (
                  <span className="badge" style={{ background: 'var(--success)', color: '#fff', fontSize: 11 }}>Publié</span>
                ) : (
                  <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)', fontSize: 11 }}>Brouillon</span>
                )}
                {n.newsFeedbacks.length > 0 && (
                  <span className="tag" style={{ fontSize: 11 }}>🔗 {n.newsFeedbacks.length} feedback{n.newsFeedbacks.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                {n.content.length > 150 ? n.content.slice(0, 150) + '…' : n.content}
              </p>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                {formaterDate(n.createdAt)} · {n.author.displayName}
                {n.publishedAt && ` · Publié le ${formaterDate(n.publishedAt)}`}
              </div>
            </div>
            <div className="row" style={{ gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(n)}>Modifier</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setLinking(n)}>🔗 Feedbacks</button>
              {!n.publishedAt && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handlePublish(n.id)}
                  disabled={publishing === n.id}
                >
                  {publishing === n.id ? '…' : 'Publier'}
                </button>
              )}
              <button
                className="btn btn-sm"
                style={{ background: 'var(--danger)', color: '#fff' }}
                onClick={() => handleDelete(n.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
