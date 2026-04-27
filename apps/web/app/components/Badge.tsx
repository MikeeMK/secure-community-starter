import React from 'react';

type TrustLevel = 'new' | 'member' | 'moderator' | 'super_admin';

interface BadgeProps {
  level: TrustLevel | string;
}

const TRUST_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  moderator:   { label: 'Modo',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)' },
  super_admin: { label: 'Admin',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' },
};

const PLAN_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  plus:    { label: '⭐ Plus',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',   border: 'rgba(99,102,241,0.3)' },
  premium: { label: '💎 Premium', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)',  border: 'rgba(124,58,237,0.3)' },
};

const pillStyle = (color: string, bg: string, border: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: 99,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.02em',
  color,
  background: bg,
  border: `1px solid ${border}`,
  lineHeight: 1.6,
});

export function TrustBadge({ level }: BadgeProps) {
  const meta = TRUST_META[level];
  if (!meta) return null;
  return <span style={pillStyle(meta.color, meta.bg, meta.border)}>{meta.label}</span>;
}

export function PlanPill({ plan }: { plan?: string | null }) {
  const meta = plan ? PLAN_META[plan] : undefined;
  if (!meta) return null;
  return <span style={pillStyle(meta.color, meta.bg, meta.border)}>{meta.label}</span>;
}

const labelsStatut: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_REVIEW: 'En examen',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = labelsStatut[status] ?? status.replace(/_/g, ' ').toLowerCase();
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {label}
    </span>
  );
}
