type TrustLevel = 'new' | 'normal' | 'trusted' | 'restricted';

interface BadgeProps {
  level: TrustLevel;
}

const labelsNiveau: Record<TrustLevel, string> = {
  new: 'Nouveau',
  normal: 'Membre',
  trusted: 'De confiance',
  restricted: 'Restreint',
};

export function TrustBadge({ level }: BadgeProps) {
  return (
    <span className={`badge badge-${level}`}>
      {labelsNiveau[level] ?? level}
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
