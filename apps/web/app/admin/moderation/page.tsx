'use client';

import React from 'react';
import { StatusBadge } from '../../components/Badge';
import { apiFetch } from '../../lib/api';

type Signalement = {
  id: string;
  status: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
  reporter: { id: string; displayName: string };
};

const labelStatut: Record<string, string> = {
  ALL: 'Tous',
  OPEN: 'Ouvert',
  IN_REVIEW: 'En examen',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
};

const labelCible: Record<string, string> = {
  USER: 'Utilisateur',
  TOPIC: 'Sujet',
  POST: 'Message',
  MESSAGE: 'MP',
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PageModeration() {
  const [signalements, setSignalements] = React.useState<Signalement[] | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [filtre, setFiltre] = React.useState<string>('ALL');

  React.useEffect(() => {
    apiFetch<Signalement[]>('/moderation/reports')
      .then(setSignalements)
      .catch((e) => setErreur(String(e)));
  }, []);

  const statuts = ['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'];

  const filtres = signalements
    ? filtre === 'ALL' ? signalements : signalements.filter((r) => r.status === filtre)
    : null;

  const compteurs = signalements
    ? statuts.slice(1).reduce((acc, s) => {
        acc[s] = signalements.filter((r) => r.status === s).length;
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <div>
      <div className="page-header row-between">
        <div>
          <h1 className="page-title">Modération</h1>
          <p className="page-subtitle">Examinez et gérez les contenus signalés</p>
        </div>
        <span className="badge badge-restricted" style={{ fontSize: 12, padding: '5px 12px' }}>
          Administration
        </span>
      </div>

      {/* Statistiques */}
      {signalements && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 28 }}>
          <div className="card card-sm stat-card">
            <div className="stat-number" style={{ fontSize: 26 }}>{signalements.length}</div>
            <div className="stat-label">Total signalements</div>
          </div>
          <div className="card card-sm stat-card">
            <div className="stat-number" style={{ fontSize: 26, color: 'var(--danger)' }}>{compteurs['OPEN'] ?? 0}</div>
            <div className="stat-label">Ouverts</div>
          </div>
          <div className="card card-sm stat-card">
            <div className="stat-number" style={{ fontSize: 26, color: 'var(--warning)' }}>{compteurs['IN_REVIEW'] ?? 0}</div>
            <div className="stat-label">En examen</div>
          </div>
          <div className="card card-sm stat-card">
            <div className="stat-number" style={{ fontSize: 26, color: 'var(--success)' }}>{compteurs['RESOLVED'] ?? 0}</div>
            <div className="stat-label">Résolus</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="row" style={{ gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {statuts.map((s) => (
          <button
            key={s}
            onClick={() => setFiltre(s)}
            className={`btn btn-sm ${filtre === s ? 'btn-primary' : 'btn-secondary'}`}
          >
            {labelStatut[s] ?? s}
            {s !== 'ALL' && signalements && (
              <span style={{
                marginLeft: 6,
                background: filtre === s ? 'rgba(0,0,0,0.2)' : 'var(--surface-3)',
                borderRadius: 99,
                padding: '1px 7px',
                fontSize: 11,
                fontWeight: 700,
              }}>
                {compteurs[s] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {erreur && <div className="error-text" style={{ marginBottom: 20 }}>{erreur}</div>}
      {!signalements && !erreur && <p className="loading-text">Chargement des signalements&hellip;</p>}

      {filtres && filtres.length === 0 && (
        <div className="card empty-state">
          <span className="empty-state-icon">&#x2705;</span>
          <p>Aucun signalement correspondant à ce filtre.</p>
        </div>
      )}

      {filtres && filtres.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Signaleur</th>
                <th>Cible</th>
                <th>Motif</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((signalement) => (
                <tr key={signalement.id}>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{signalement.reporter.displayName}</span>
                  </td>
                  <td>
                    <span className="tag">
                      {labelCible[signalement.targetType] ?? signalement.targetType}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3, fontFamily: 'monospace' }}>
                      {signalement.targetId.slice(0, 12)}&hellip;
                    </div>
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {signalement.reason.length > 80
                        ? signalement.reason.slice(0, 80) + '\u2026'
                        : signalement.reason}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formaterDate(signalement.createdAt)}
                  </td>
                  <td>
                    <StatusBadge status={signalement.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
