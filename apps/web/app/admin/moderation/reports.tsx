'use client';

import React from 'react';
import { apiFetch } from '../../lib/api';

type Report = {
  id: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  targetType: string;
  targetId: string;
  reason: string;
  resolutionReason?: string | null;
  rewardTokens?: number | null;
  createdAt: string;
  reporter: { id: string; displayName: string };
  handledById?: string | null;
};

const STATUS_LABELS: Record<Report['status'], string> = {
  OPEN: 'Ouvert',
  IN_REVIEW: 'En examen',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
};

export default function ReportsPage() {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<Report[]>('/moderation/reports')
      .then((r) => { setReports(r); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  async function updateReport(id: string, status: Report['status'], rewardTokens = 0) {
    const reason = prompt('Raison (optionnel)', '');
    try {
      const res = await apiFetch<Report>(`/moderation/reports/${id}`, {
        method: 'POST',
        body: JSON.stringify({ status, resolutionReason: reason || undefined, rewardTokens }),
      });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...res } : r)));
    } catch {
      alert('Mise à jour impossible');
    }
  }

  if (loading) return <p className="loading-text">Chargement…</p>;
  if (error) return <div className="error-text">{error}</div>;

  return (
    <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1 className="page-title">Signalements</h1>
      <p className="page-subtitle">Signaux utilisateurs sur les topics / posts / messages</p>

      <div className="card" style={{ padding: 0 }}>
        {reports.length === 0 && <p style={{ padding: 18, color: 'var(--text-muted)' }}>Aucun signalement.</p>}
        {reports.map((r) => (
          <div key={r.id} style={{
            padding: 16,
            borderBottom: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 12,
            alignItems: 'center',
          }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <span className="tag tag-muted" style={{ fontSize: 11 }}>{r.targetType}</span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>ID: {r.targetId}</span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Reporter: {r.reporter.displayName} ({r.reporter.id})</span>
                <span className="tag tag-primary" style={{ fontSize: 11 }}>{STATUS_LABELS[r.status]}</span>
              </div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{r.reason}</div>
              {r.resolutionReason && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  Note : {r.resolutionReason} {r.rewardTokens ? `( +${r.rewardTokens} tokens )` : ''}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-xs" onClick={() => updateReport(r.id, 'IN_REVIEW')}>En examen</button>
              <button className="btn btn-primary btn-xs" onClick={() => updateReport(r.id, 'RESOLVED', 10)}>Résoudre (+10)</button>
              <button className="btn btn-secondary btn-xs" onClick={() => updateReport(r.id, 'DISMISSED')}>Rejeter</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
