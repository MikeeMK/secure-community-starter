'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { TrustBadge } from '../../components/Badge';
import { apiFetch } from '../../lib/api';

type Sujet = {
  id: string;
  title: string;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string };
};

type Groupe = {
  id: string;
  name: string;
  isPrivate: boolean;
  createdAt: string;
  topics: Sujet[];
};

export default function PageGroupe() {
  const { id } = useParams<{ id: string }>();
  const [groupe, setGroupe] = React.useState<Groupe | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    apiFetch<Groupe>(`/community/groups/${id}`)
      .then(setGroupe)
      .catch((e) => setErreur(String(e)));
  }, [id]);

  if (erreur) return (
    <div>
      <Link href="/groupes" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>&larr; Groupes</Link>
      <div className="error-text">{erreur}</div>
    </div>
  );

  if (!groupe) return (
    <div>
      <Link href="/groupes" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>&larr; Groupes</Link>
      <p className="loading-text">Chargement&hellip;</p>
    </div>
  );

  const nbSujets = groupe.topics.length;

  return (
    <div className="stack-lg">
      <div>
        <Link href="/groupes" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
          &larr; Groupes
        </Link>

        <div className="card">
          <div className="row-between" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{groupe.name}</h1>
            {groupe.isPrivate && <span className="badge badge-restricted">Privé</span>}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Créé le {new Date(groupe.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            &nbsp;·&nbsp;
            {nbSujets} sujet{nbSujets > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div>
        <div className="section-title">Sujets dans ce groupe</div>

        {groupe.topics.length === 0 && (
          <div className="card empty-state">
            <span className="empty-state-icon">&#x1F4DD;</span>
            <p>Aucun sujet dans ce groupe pour l&apos;instant.</p>
          </div>
        )}

        {groupe.topics.length > 0 && (
          <div className="card" style={{ padding: '4px 20px' }}>
            {groupe.topics.map((sujet) => (
              <Link key={sujet.id} href={`/forum/${sujet.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div className="topic-item">
                  <Avatar name={sujet.author.displayName} size="md" />
                  <div style={{ flex: 1 }}>
                    <div className="topic-title">{sujet.title}</div>
                    <div className="topic-meta">
                      <span>{sujet.author.displayName}</span>
                      <TrustBadge level={sujet.author.trustLevel as 'new' | 'normal' | 'trusted' | 'restricted'} />
                      <span className="topic-separator">·</span>
                      <span>{new Date(sujet.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
