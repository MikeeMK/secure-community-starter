import Link from 'next/link';

const gradeLabel: Record<string, string> = {
  new: 'Nouveau',
  member: 'Membre',
  moderator: 'Modérateur',
  super_admin: 'Super Admin',
};

export function PlanWidget({ trustLevel }: { trustLevel: string }) {
  const isPaid = trustLevel === 'plus' || trustLevel === 'premium';

  return (
    <div className="card">
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Mon abonnement</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className={`plan-badge ${isPaid ? trustLevel : ''}`}>
          {isPaid ? '⭐' : '🆓'} {gradeLabel[trustLevel] ?? trustLevel}
        </span>
      </div>
      {!isPaid && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(156,39,176,0.08))',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
            Passez à <strong style={{ color: '#7c3aed' }}>Plus</strong> pour accéder aux messages privés, profils avancés et plus encore.
          </p>
          <Link href="/abonnement" className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#9c27b0)', color: '#fff', fontSize: 12 }}>
            Voir les offres
          </Link>
        </div>
      )}
    </div>
  );
}
