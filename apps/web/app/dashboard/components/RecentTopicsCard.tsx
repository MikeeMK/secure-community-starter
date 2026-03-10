'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

type Topic = {
  id: string;
  title: string;
  createdAt: string;
  posts?: { id: string }[];
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function RecentTopicsCard({ userId }: { userId: string }) {
  const [topics, setTopics] = React.useState<Topic[] | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [titre, setTitre] = React.useState('');
  const [corps, setCorps] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    apiFetch<Topic[]>('/community/forum/topics')
      .then((all) => setTopics(all.filter((t: any) => t.author?.id === userId || t.authorId === userId).slice(0, 5)))
      .catch(() => setTopics([]));
  }, [userId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const topic = await apiFetch<Topic>('/community/forum/topics', {
        method: 'POST',
        body: JSON.stringify({ title: titre, body: corps }),
      });
      setTopics((prev) => [topic, ...(prev ?? [])]);
      setTitre('');
      setCorps('');
      setShowForm(false);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Mes sujets récents</span>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Annuler' : '+ Nouveau sujet'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handlePost} className="stack" style={{ marginBottom: 16 }}>
          <input
            className="form-input"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Titre du sujet"
            required minLength={3}
          />
          <textarea
            className="form-input"
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            placeholder="Contenu…"
            required rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Publication…' : 'Publier'}
          </button>
        </form>
      )}

      {!topics && <p className="loading-text" style={{ fontSize: 13 }}>Chargement…</p>}

      {topics && topics.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-dim)', fontSize: 13 }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>💬</div>
          Vous n'avez pas encore posté de sujet
        </div>
      )}

      {topics && topics.map((t) => (
        <Link key={t.id} href={`/forum/${t.id}`} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-base)', lineHeight: 1.4, flex: 1, marginRight: 8 }}>
              {t.title}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', marginTop: 2 }}>
              {formaterDate(t.createdAt)}
            </span>
          </div>
        </Link>
      ))}

      {topics && topics.length > 0 && (
        <Link href="/forum" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, display: 'block', marginTop: 10 }}>
          Voir tous mes sujets →
        </Link>
      )}
    </div>
  );
}
