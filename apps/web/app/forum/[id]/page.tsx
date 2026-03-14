'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { TrustBadge, PlanPill } from '../../components/Badge';
import { RichContent } from '../../components/RichContent';
import { UserProfileTrigger } from '../../components/UserProfileTrigger';
import { RichTextarea } from '../../components/RichTextarea';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type Message = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel?: string };
};

type Sujet = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  closed?: boolean;
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
  const [actionsOuvertes, setActionsOuvertes] = React.useState<string | null>(null);
  const { utilisateur } = useAuth();

  const estStaff = utilisateur ? ['moderator', 'super_admin'].includes(utilisateur.trustLevel) : false;
  const estAuteur = utilisateur && sujet ? utilisateur.id === sujet.author.id : false;

  const renderBadges = (trust?: string) => {
    if (!trust) return null;
    const isStaff = trust === 'moderator' || trust === 'super_admin';
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {isStaff && <TrustBadge level={trust} />}
        {!isStaff && <PlanPill plan={trust} />}
      </span>
    );
  };

  React.useEffect(() => {
    if (!id) return;
    apiFetch<Sujet>(`/community/forum/topics/${id}`)
      .then(setSujet)
      .catch((e) => setErreur(String(e)));
  }, [id]);

  async function modifierMessage(message: Message) {
    const nouveauCorps = prompt('Modifier le message', message.body);
    if (!nouveauCorps || !nouveauCorps.trim()) return;
    try {
      const maj = await apiFetch<Message>(`/community/forum/posts/${message.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: nouveauCorps }),
      });
      setSujet((prev) => prev ? { ...prev, posts: prev.posts.map((p) => (p.id === message.id ? maj : p)) } : prev);
      setActionsOuvertes(null);
    } catch (e) {
      setErreur(String(e));
    }
  }

  async function supprimerMessage(messageId: string) {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await apiFetch(`/community/forum/posts/${messageId}`, { method: 'DELETE' });
      setSujet((prev) => prev ? { ...prev, posts: prev.posts.filter((p) => p.id !== messageId) } : prev);
      setActionsOuvertes(null);
    } catch (e) {
      setErreur(String(e));
    }
  }

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
          <div className="row" style={{ marginBottom: 16, gap: 12, alignItems: 'flex-start' }}>
            <Avatar name={sujet.author.displayName} size="md" />
            <div style={{ flex: 1 }}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                <UserProfileTrigger
                  userId={sujet.author.id}
                  displayName={sujet.author.displayName}
                  style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}
                >
                  <span>{sujet.author.displayName}</span>
                </UserProfileTrigger>
                {renderBadges(sujet.author.trustLevel)}
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formaterDate(sujet.createdAt)}</span>
                {sujet.group && <span className="tag tag-primary">{sujet.group.name}</span>}
                {sujet.closed && <span className="tag tag-muted">Fermé</span>}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                {sujet.title}
              </h1>
            </div>
            {(estStaff || estAuteur) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  try {
                    const next = !sujet.closed;
                    const maj = await apiFetch<Sujet>(`/community/forum/topics/${sujet.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ closed: next }),
                    });
                    setSujet((prev) => prev ? { ...prev, closed: maj.closed } : prev);
                  } catch (e) {
                    setErreur(String(e));
                  }
                }}
              >
                {sujet.closed ? 'Réouvrir' : 'Fermer'}
              </button>
            )}
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <RichContent value={sujet.body} />
          </div>

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
                    <UserProfileTrigger
                      userId={message.author.id}
                      displayName={message.author.displayName}
                      style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}
                    >
                      <span>{message.author.displayName}</span>
                    </UserProfileTrigger>
                    {renderBadges(message.author.trustLevel)}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formaterDate(message.createdAt)}</span>
                    {estStaff && (
                      <div style={{ position: 'relative', marginLeft: 'auto' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setActionsOuvertes((prev) => (prev === message.id ? null : message.id))}
                        >
                          ⋮
                        </button>
                        {actionsOuvertes === message.id && (
                          <div
                            className="card"
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 28,
                              padding: 8,
                              width: 140,
                              zIndex: 10,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ width: '100%', justifyContent: 'flex-start' }}
                              onClick={() => modifierMessage(message)}
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger, #c0392b)' }}
                              onClick={() => supprimerMessage(message.id)}
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <RichContent
                    value={message.body}
                    className="post-body"
                    style={{ fontSize: 14, whiteSpace: 'normal' }}
                  />
                  <div style={{ marginTop: 10 }}>
                    <BoutonJaime />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sujet.closed && !estStaff && !estAuteur ? (
          <div className="card card-accent">
            <p style={{ margin: 0, fontSize: 14 }}>Ce sujet est fermé. Vous ne pouvez plus répondre.</p>
          </div>
        ) : (
          <FormulaireReponse
            sujetId={id}
            onPublie={(msg) => setSujet((prev) => prev ? { ...prev, posts: [...prev.posts, msg] } : prev)}
          />
        )}
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
  const { utilisateur } = useAuth();
  const [corps, setCorps] = React.useState('');
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    if (!utilisateur) {
      setErreur('Connexion requise');
      setChargement(false);
      return;
    }
    try {
      const message = await apiFetch<Message>(`/community/forum/topics/${sujetId}/posts`, {
        method: 'POST',
        body: JSON.stringify({ body: corps }),
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
          <RichTextarea
            value={corps}
            onChange={setCorps}
            rows={5}
            placeholder="Rédigez votre réponse…"
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
