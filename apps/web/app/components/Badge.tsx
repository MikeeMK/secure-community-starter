type TrustLevel = 'new' | 'member' | 'moderator' | 'super_admin';

interface BadgeProps {
  level: TrustLevel | string;
}

export function TrustBadge(_: BadgeProps) {
  return null;
}

export function PlanPill(_: { plan?: string | null }) {
  return null;
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
