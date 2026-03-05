'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';

type Groupe = {
  id: string;
  name: string;
  isPrivate: boolean;
  createdAt: string;
  _count?: { topics: number };
};

export default function PageGroupes() {
  const [groupes, setGroupes] = React.useState<Groupe[] | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<Groupe[]>('/community/groups')
      .then(setGroupes)
      .catch((e) => setErreur(String(e)));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Groupes</h1>
        <p className="page-subtitle">Espaces thématiques pour des discussions ciblées</p>
      </div>

      {erreur && <div className="error-text" style={{ marginBottom: 20 }}>{erreur}</div>}
      {!groupes && !erreur && <p className="loading-text">Chargement des groupes&hellip;</p>}

      {groupes && groupes.length === 0 && (
        <div className="card empty-state">
          <span className="empty-state-icon">&#x1F465;</span>
          <p>Aucun groupe pour l&apos;instant.</p>
        </div>
      )}

      {groupes && groupes.length > 0 && (
        <div className="grid-2">
          {groupes.map((groupe) => (
            <Link key={groupe.id} href={`/groupes/${groupe.id}`} className="group-card">
              <div className="row-between">
                <span className="group-card-name">{groupe.name}</span>
                {groupe.isPrivate && (
                  <span className="badge badge-restricted">Privé</span>
                )}
              </div>
              <div className="row" style={{ gap: 14, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {groupe._count?.topics ?? 0} sujet{(groupe._count?.topics ?? 0) > 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  Depuis {new Date(groupe.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
