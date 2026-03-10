'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../lib/api';
import { RichTextarea } from '../../../components/RichTextarea';

export default function ModifierAnnoncePage() {
  const { id } = useParams<{ id: string }>();
  const { utilisateur, estAuthentifie } = useAuth();
  const router = useRouter();

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [fetchDone, setFetchDone] = React.useState(false);

  React.useEffect(() => {
    if (!estAuthentifie) { router.push('/connexion'); return; }
    if (!id) return;
    apiFetch<{ id: string; title: string; body: string; author: { id: string } }>(`/community/forum/topics/${id}`)
      .then((t) => {
        if (t.author.id !== utilisateur?.id) { router.push('/annonces'); return; }
        setTitle(t.title);
        setBody(t.body);
        setFetchDone(true);
      })
      .catch(() => router.push('/annonces'));
  }, [id, estAuthentifie, utilisateur, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/community/forum/topics/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, body }),
      });
      setSaved(true);
      setTimeout(() => router.push(`/annonces/${id}`), 800);
    } finally {
      setLoading(false);
    }
  }

  if (!fetchDone) return <div className="loading-text">Chargement…</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Modifier mon annonce</h1>
      <form onSubmit={handleSave} className="stack">
        <div className="form-group">
          <label className="form-label">Titre</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required minLength={3} maxLength={120}
            placeholder="Titre de votre annonce"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <RichTextarea value={body} onChange={setBody} placeholder="Décrivez ce que vous recherchez…" rows={8} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push(`/annonces/${id}`)}>
            Annuler
          </button>
          {saved && <span style={{ color: 'var(--success, #22c55e)', fontSize: 13, fontWeight: 600 }}>Sauvegardé !</span>}
        </div>
      </form>
    </div>
  );
}
