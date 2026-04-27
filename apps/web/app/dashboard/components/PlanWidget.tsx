'use client';

import Link from 'next/link';
import React from 'react';
import { apiFetch } from '../../lib/api';

type PlanInfo = {
  plan: 'free' | 'plus' | 'premium';
  planExpiresAt: string | null;
  announcementsUsed: number;
  announcementsMax: number;
};

const PLAN_META: Record<string, { label: string; icon: string; color: string }> = {
  free:    { label: 'Free',    icon: '🆓', color: 'var(--text-muted)' },
  plus:    { label: 'Plus',    icon: '⭐', color: '#6366f1' },
  premium: { label: 'Premium', icon: '💎', color: '#7c3aed' },
};

export function PlanWidget({ trustLevel }: { trustLevel: string }) {
  const [info, setInfo] = React.useState<PlanInfo | null>(null);

  React.useEffect(() => {
    apiFetch<PlanInfo>('/plan').then(setInfo).catch(() => {});
  }, []);

  const plan = info?.plan ?? 'free';
  const meta = PLAN_META[plan] ?? PLAN_META.free;
  const isPaid = plan === 'plus' || plan === 'premium';

  return (
    <div className="card">
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Mon abonnement</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: info ? 12 : 0 }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 99,
          fontSize: 12,
          fontWeight: 700,
          background: isPaid ? `${meta.color}18` : 'var(--surface-2)',
          color: isPaid ? meta.color : 'var(--text-muted)',
          border: `1px solid ${isPaid ? `${meta.color}40` : 'var(--border)'}`,
        }}>
          {meta.icon} {meta.label}
        </span>
        {info && (
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            {info.announcementsUsed}/{info.announcementsMax} annonce{info.announcementsMax > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {!isPaid && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(156,39,176,0.08))',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
            Passez à <strong style={{ color: '#7c3aed' }}>Plus</strong> ou <strong style={{ color: '#7c3aed' }}>Premium</strong> pour plus d'annonces, de photos et de visibilité.
          </p>
          <Link href="/subscriptions" className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#9c27b0)', color: '#fff', fontSize: 12 }}>
            Voir les offres
          </Link>
        </div>
      )}

      {isPaid && (
        <Link href="/subscriptions" style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
          Gérer mon abonnement →
        </Link>
      )}
    </div>
  );
}
