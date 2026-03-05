'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { TrustBadge } from '../../components/Badge';
import { apiFetch } from '../../lib/api';

type ProfilUtilisateur = {
  id: string;
  displayName: string;
  trustLevel: 'new' | 'normal' | 'trusted' | 'restricted';
  createdAt: string;
  bio?: string;
  forumTopics: { id: string; title: string; createdAt: string }[];
  forumPosts: { id: string; body: string; createdAt: string; topic: { id: string; title: string } }[];
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

const labelNiveau: Record<string, string> = {
  new: 'Nouveau',
  normal: 'Membre',
  trusted: 'De confiance',
  restricted: 'Restreint',
};

export default function PageProfil() {
  const { id } = useParams<{ id: string }>();
  const [utilisateur, setUtilisateur] = React.useState<ProfilUtilisateur | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [onglet, setOnglet] = React.useState<'sujets' | 'reponses'>('sujets');

  React.useEffect(() => {
    if (!id) return;
    apiFetch<ProfilUtilisateur>(`/users/${id}`)
      .then(setUtilisateur)
      .catch((e) => setErreur(String(e)));
  }, [id]);

  if (erreur) return <div className="error-text">{erreur}</div>;
  if (!utilisateur) return <p className="loading-text">Chargement du profil&hellip;</p>;

  return (
    <div className="stack-lg">
      {/* Carte profil */}
      <div className="card card-lg">
        <div className="row" style={{ gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Avatar name={utilisateur.displayName} size="xl" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="row" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {utilisateur.displayName}
              </h1>
              <TrustBadge level={utilisateur.trustLevel} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
              Membre depuis {formaterDate(utilisateur.createdAt)}
            </p>
            {utilisateur.bio ? (
              <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>{utilisateur.bio}</p>
            ) : (
              <p style={{ color: 'var(--text-dim)', fontSize: 14, fontStyle: 'italic' }}>
                Aucune biographie pour l&apos;instant.
              </p>
            )}
          </div>
        </div>

        <hr className="divider" />

        <div className="row" style={{ gap: 32 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              {utilisateur.forumTopics.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: 2 }}>
              Sujets
            </div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              {utilisateur.forumPosts.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: 2 }}>
              Réponses
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              {labelNiveau[utilisateur.trustLevel] ?? utilisateur.trustLevel}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: 2 }}>
              Niveau
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div>
        <div className="tabs">
          <button className={`tab-btn ${onglet === 'sujets' ? 'active' : ''}`} onClick={() => setOnglet('sujets')}>
            Sujets ({utilisateur.forumTopics.length})
          </button>
          <button className={`tab-btn ${onglet === 'reponses' ? 'active' : ''}`} onClick={() => setOnglet('reponses')}>
            Réponses ({utilisateur.forumPosts.length})
          </button>
        </div>

        {onglet === 'sujets' && (
          <div className="card" style={{ padding: '4px 20px' }}>
            {utilisateur.forumTopics.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">&#x1F4AC;</span>
                <p>Aucun sujet publié pour l&apos;instant.</p>
              </div>
            )}
            {utilisateur.forumTopics.map((sujet) => (
              <div key={sujet.id} className="topic-item">
                <div style={{ flex: 1 }}>
                  <Link href={`/forum/${sujet.id}`} className="topic-title" style={{ display: 'block' }}>
                    {sujet.title}
                  </Link>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    {new Date(sujet.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {onglet === 'reponses' && (
          <div className="card" style={{ padding: '4px 20px' }}>
            {utilisateur.forumPosts.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">&#x1F4DD;</span>
                <p>Aucune réponse publiée pour l&apos;instant.</p>
              </div>
            )}
            {utilisateur.forumPosts.map((reponse) => (
              <div key={reponse.id} className="post-item" style={{ flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Réponse dans{' '}
                  <Link href={`/forum/${reponse.topic.id}`} style={{ fontWeight: 600 }}>
                    {reponse.topic.title}
                  </Link>
                  {' '}·{' '}
                  {new Date(reponse.createdAt).toLocaleDateString('fr-FR')}
                </div>
                <p className="post-body" style={{ fontSize: 13 }}>
                  {reponse.body.length > 200 ? reponse.body.slice(0, 200) + '…' : reponse.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
