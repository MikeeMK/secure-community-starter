import Link from 'next/link';

type ConfirmationPageProps = {
  searchParams?: {
    email?: string;
    displayName?: string;
    devUrl?: string;
  };
};

export default function PageConfirmationInscription({
  searchParams,
}: ConfirmationPageProps) {
  const email = searchParams?.email?.trim();
  const displayName = searchParams?.displayName?.trim();
  const devUrl = searchParams?.devUrl?.trim();

  return (
    <div style={{ maxWidth: 520, margin: '64px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
          E-mail envoyé
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          Votre compte a bien été créé. Il faut maintenant confirmer votre adresse e-mail.
        </p>
      </div>

      <div className="card card-lg" style={{ display: 'grid', gap: 18 }}>
        <div
          style={{
            display: 'grid',
            gap: 10,
            padding: 18,
            borderRadius: 'calc(var(--radius) - 4px)',
            background: 'rgba(91, 214, 200, 0.08)',
            border: '1px solid rgba(91, 214, 200, 0.18)',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 15 }}>
            {displayName ? `Bienvenue ${displayName},` : 'Bienvenue,'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
            {email
              ? `Un lien de confirmation a été envoyé à ${email}.`
              : 'Un lien de confirmation vient d être envoyé à votre adresse e-mail.'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
            Ouvrez votre boîte mail, cliquez sur le lien reçu, puis revenez vous connecter.
          </p>
        </div>

        {devUrl && (
          <div
            style={{
              padding: 16,
              borderRadius: 'calc(var(--radius) - 4px)',
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--warning)' }}>
              Mode local sans SMTP
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
              Aucun serveur mail n est actif ici. Utilise ce lien direct pour simuler la confirmation.
            </p>
            <a
              href={devUrl}
              style={{
                display: 'block',
                fontSize: 12,
                lineHeight: 1.5,
                wordBreak: 'break-all',
                color: 'var(--primary)',
                textDecoration: 'underline',
              }}
            >
              {devUrl}
            </a>
          </div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          <Link
            href="/connexion"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Aller à la connexion
          </Link>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Si tu ne vois rien, verifie aussi les spams et promotions.
          </p>
        </div>
      </div>
    </div>
  );
}
