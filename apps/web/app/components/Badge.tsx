type TrustLevel = 'new' | 'member' | 'moderator' | 'super_admin';

interface BadgeProps {
  level: TrustLevel | string;
}

const labelsNiveau: Record<string, string> = {
  new: 'Nouveau',
  member: 'Membre',
  moderator: 'Modérateur',
  super_admin: 'Super Admin',
};

export function TrustBadge({ level }: BadgeProps) {
  return (
    <span className={`badge badge-${level}`}>
      {labelsNiveau[level] ?? level}
    </span>
  );
}

const planColors: Record<string, { bg: string; text: string; border: string }> = {
  member: { bg: 'rgba(245, 158, 11, 0.18)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.35)' },
  plus: { bg: 'rgba(236, 72, 153, 0.18)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.35)' },
  premium: { bg: 'rgba(139, 92, 246, 0.18)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.35)' },
};

export function PlanPill({ plan }: { plan?: string | null }) {
  if (!plan) return null;
  const normalized = plan.toLowerCase();
  const c = planColors[normalized] ?? planColors.member;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      borderRadius: 999,
      border: `1px solid ${c.border}`,
      background: c.bg,
      color: c.text,
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      lineHeight: 1,
    }}>
      {plan}
    </span>
  );
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
