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
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header gradient */}
      <div style={{
        background: isPaid
          ? `linear-gradient(135deg, ${meta.color}22, ${meta.color}08)`
          : 'linear-gradient(135deg, rgba(124,58,237,0.10), rgba(99,102,241,0.06))',
        borderBottom: `1px solid ${isPaid ? `${meta.color}30` : 'rgba(124,58,237,0.15)'}`,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 4 }}>
            Mon abonnement
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 800,
              background: isPaid ? `${meta.color}25` : 'rgba(124,58,237,0.12)',
              color: isPaid ? meta.color : '#7c3aed',
              border: `1px solid ${isPaid ? `${meta.color}50` : 'rgba(124,58,237,0.3)'}`,
            }}>
              {meta.icon} {meta.label}
            </span>
          </div>
        </div>
        {info && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
              {info.announcementsUsed}<span style={{ fontSize: 14, color: 'var(--text-dim)' }}>/{info.announcementsMax}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>annonce{info.announcementsMax > 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px' }}>
        {!isPaid && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {[
                { plan: 'Plus', price: '4,99€/mois', color: '#6366f1', icon: '⭐', perks: '2 annonces · 5 photos · Badge' },
                { plan: 'Premium', price: '9,99€/mois', color: '#7c3aed', icon: '💎', perks: '3 annonces · 8 photos · Boost' },
              ].map((p) => (
                <div key={p.plan} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '8px 12px', borderRadius: 10,
                  background: `${p.color}10`, border: `1px solid ${p.color}25`,
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{p.icon} {p.plan}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{p.perks}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{p.price}</span>
                </div>
              ))}
            </div>
            <Link
              href="/subscriptions"
              className="btn btn-sm"
              style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff', fontWeight: 700, border: 'none' }}
            >
              Voir les offres →
            </Link>
          </>
        )}

        {isPaid && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {info?.planExpiresAt && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Expire le {new Date(info.planExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            <Link href="/subscriptions" style={{ fontSize: 13, color: meta.color, fontWeight: 700 }}>
              Gérer mon abonnement →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
