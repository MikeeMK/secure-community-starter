'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { TrustBadge } from '../../components/Badge';
import { apiFetch } from '../../lib/api';

type Message = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; displayName: string };
};

type Sujet = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string };
  group: { id: string; name: string } | null;
  posts: Message[];
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function PageSujet() {
  const { id } = useParams<{ id: string }>();
  const [sujet, setSujet] = React.useState<Sujet | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    apiFetch<Sujet>(`/community/forum/topics/${id}`)
      .then(setSujet)
      .catch((e) => setErreur(String(e)));
  }, [id]);

  if (erreur) return (
    <div>
      <Link href="/forum" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>&larr; Retour au forum</Link>
      <div className="error-text">{erreur}</div>
    </div>
  );

  if (!sujet) return (
    <div>
      <Link href="/forum" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>&larr; Retour au forum</Link>
      <p className="loading-text">Chargement&hellip;</p>
    </div>
  );

  const nbReponses = sujet.posts.length;

  return (
    <div className="stack-lg">
      {/* Retour + sujet principal */}
      <div>
        <Link href="/forum" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
          &larr; Retour au forum
        </Link>

        <div className="card">
          <div className="row-between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em', flex: 1 }}>
              {sujet.title}
            </h1>
            {sujet.group && <span className="tag tag-primary">{sujet.group.name}</span>}
          </div>

          <div className="row" style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <Avatar name={sujet.author.displayName} size="md" />
            <div>
              <Link href={`/profil/${sujet.author.id}`} style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
                {sujet.author.displayName}
              </Link>
              <div className="row" style={{ gap: 8, marginTop: 3 }}>
                <TrustBadge level={sujet.author.trustLevel as 'new' | 'normal' | 'trusted' | 'restricted'} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formaterDate(sujet.createdAt)}</span>
              </div>
            </div>
          </div>

          <p style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {sujet.body}
          </p>

          <div style={{ marginTop: 20 }}>
            <BoutonJaime />
          </div>
        </div>
      </div>

      {/* Réponses */}
      <div>
        <div className="section-title">
          {nbReponses} {nbReponses === 1 ? 'réponse' : 'réponses'}
        </div>

        {sujet.posts.length > 0 && (
          <div className="card" style={{ marginBottom: 24, padding: '8px 20px' }}>
            {sujet.posts.map((message) => (
              <div key={message.id} className="post-item">
                <Avatar name={message.author.displayName} size="md" />
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ marginBottom: 8 }}>
                    <Link href={`/profil/${message.author.id}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                      {message.author.displayName}
                    </Link>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formaterDate(message.createdAt)}</span>
                  </div>
                  <p className="post-body">{message.body}</p>
                  <div style={{ marginTop: 10 }}>
                    <BoutonJaime />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <FormulaireReponse
          sujetId={id}
          onPublie={(msg) => setSujet((prev) => prev ? { ...prev, posts: [...prev.posts, msg] } : prev)}
        />
      </div>
    </div>
  );
}

function BoutonJaime() {
  const [aime, setAime] = React.useState(false);
  const [compte, setCompte] = React.useState(0);
  return (
    <button
      className={`reaction-btn ${aime ? 'active' : ''}`}
      onClick={() => { setAime(!aime); setCompte((c) => aime ? c - 1 : c + 1); }}
    >
      ♥ {compte > 0 ? compte : 'J\'aime'}
    </button>
  );
}

function FormulaireReponse({ sujetId, onPublie }: { sujetId: string; onPublie: (m: Message) => void }) {
  const [corps, setCorps] = React.useState('');
  const [auteurId, setAuteurId] = React.useState('');
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    try {
      const message = await apiFetch<Message>(`/community/forum/topics/${sujetId}/posts`, {
        method: 'POST',
        body: JSON.stringify({ body: corps, authorId: auteurId }),
      });
      onPublie(message);
      setCorps('');
    } catch (e) {
      setErreur(String(e));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="card card-accent">
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.01em' }}>
        Écrire une réponse
      </h3>
      <form onSubmit={handleSubmit} className="stack">
        <div className="form-group">
          <label className="form-label">ID auteur (temporaire — viendra de la session)</label>
          <input className="form-input" value={auteurId} onChange={(e) => setAuteurId(e.target.value)} required placeholder="ID utilisateur" />
        </div>
        <div className="form-group">
          <textarea
            className="form-textarea"
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            required
            rows={4}
            placeholder="Rédigez votre réponse&hellip;"
          />
        </div>
        {erreur && <div className="error-text">{erreur}</div>}
        <div>
          <button type="submit" className="btn btn-primary" disabled={chargement}>
            {chargement ? 'Publication&hellip;' : 'Publier la réponse'}
          </button>
        </div>
      </form>
    </div>
  );
}
