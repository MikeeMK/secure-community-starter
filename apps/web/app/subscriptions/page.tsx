'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type PlanInfo = {
  plan: 'free' | 'plus' | 'premium';
  planExpiresAt: string | null;
  announcementsUsed: number;
  announcementsMax: number;
};

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    price: '0€',
    period: '',
    color: 'var(--text-muted)',
    gradient: '',
    popular: false,
    features: [
      '1 annonce active',
      '5 photos par annonce',
      'Messagerie standard',
      'Accès à la communauté',
    ],
    cta: 'Votre plan actuel',
    ctaDisabled: true,
  },
  {
    id: 'plus',
    label: 'Plus',
    icon: '⭐',
    price: '5,99€',
    period: '/mois',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    popular: true,
    features: [
      '3 annonces actives',
      '5 photos par annonce',
      'Album photo (jusqu\'à 10 photos)',
      'Badge Plus visible',
      'Voir les visiteurs de profil',
      'Filtres avancés',
    ],
    cta: 'Passer à Plus',
    ctaDisabled: false,
  },
  {
    id: 'premium',
    label: 'Premium',
    icon: '💎',
    price: '9,99€',
    period: '/mois',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed, #9c27b0)',
    popular: false,
    features: [
      '5 annonces actives',
      '5 photos par annonce',
      'Album photo (jusqu\'à 20 photos)',
      'Badge Premium visible',
      'Statistiques profil avancées',
      '1 boost offert par mois',
      'Mise en avant renforcée',
    ],
    cta: 'Passer à Premium',
    ctaDisabled: false,
  },
] as const;

export default function SubscriptionsPage() {
  const { estAuthentifie } = useAuth();
  const [currentPlan, setCurrentPlan] = React.useState<PlanInfo | null>(null);

  React.useEffect(() => {
    if (!estAuthentifie) return;
    apiFetch<PlanInfo>('/plan').then(setCurrentPlan).catch(() => {});
  }, [estAuthentifie]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 10 }}>
          Abonnements
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 14 }}>
          Choisissez votre offre
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          Publiez plus d'annonces, ajoutez plus de photos et gagnez en visibilité grâce aux offres Plus et Premium.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}>
        {PLANS.map((plan) => {
          const isActive = currentPlan?.plan === plan.id;
          const isPaid = plan.id !== 'free';

          return (
            <div
              key={plan.id}
              className="card"
              style={{
                position: 'relative',
                padding: 28,
                border: isActive
                  ? `2px solid ${plan.color}`
                  : isPaid
                  ? `1px solid ${plan.color}30`
                  : '1px solid var(--border)',
                background: isPaid
                  ? `linear-gradient(180deg, ${plan.color}06 0%, transparent 100%)`
                  : undefined,
                transform: plan.id === 'plus' ? 'translateY(-4px)' : undefined,
                boxShadow: plan.id === 'plus'
                  ? `0 0 40px ${plan.color}20, 0 8px 32px rgba(0,0,0,0.2)`
                  : undefined,
              }}
            >
              {'popular' in plan && plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.gradient,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '4px 14px',
                  borderRadius: 99,
                }}>
                  Populaire
                </div>
              )}

              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: `${plan.color}20`,
                  color: plan.color,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 99,
                  border: `1px solid ${plan.color}40`,
                }}>
                  Actuel
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                {'icon' in plan && (
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{plan.icon}</div>
                )}
                <div style={{ fontSize: 22, fontWeight: 900, color: isPaid ? plan.color : 'var(--text)', marginBottom: 4 }}>
                  {plan.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)' }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{plan.period}</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    <span style={{ color: isPaid ? plan.color : 'var(--primary)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '12px 0',
                  borderRadius: 'var(--radius)',
                  background: `${plan.color}12`,
                  color: plan.id === 'free' ? 'var(--text-muted)' : plan.color,
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                  {plan.id === 'free' ? 'Plan actuel' : 'Abonnement actif'}
                </div>
              ) : !estAuthentifie ? (
                <Link href="/connexion" className="btn btn-sm" style={{
                  display: 'block',
                  textAlign: 'center',
                  background: isPaid ? plan.gradient : undefined,
                  color: isPaid ? '#fff' : undefined,
                  border: isPaid ? 'none' : undefined,
                  fontWeight: 700,
                  padding: '12px 0',
                }}>
                  Se connecter pour souscrire
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled
                  style={{
                    width: '100%',
                    background: isPaid ? plan.gradient : undefined,
                    color: isPaid ? '#fff' : undefined,
                    border: isPaid ? 'none' : undefined,
                    fontWeight: 700,
                    padding: '12px 0',
                    opacity: 0.7,
                    cursor: 'not-allowed',
                  }}
                >
                  Bientôt disponible
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 48, color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.7 }}>
        <p>Le paiement en ligne est bientôt disponible. En attendant, <Link href="/feedback" style={{ color: 'var(--primary)' }}>contactez-nous</Link> pour toute demande d'activation manuelle.</p>
        <p style={{ marginTop: 8 }}>
          <Link href="/legal/cgv" style={{ color: 'var(--text-muted)', marginRight: 16 }}>CGV</Link>
          <Link href="/legal/mentions-legales" style={{ color: 'var(--text-muted)' }}>Mentions légales</Link>
        </p>
      </div>
    </div>
  );
}
