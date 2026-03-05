import Link from 'next/link';

export default function PageConfidentialite() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/" className="btn btn-ghost btn-sm">&larr; Accueil</Link>
      </div>

      <div className="card card-lg">
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Politique de Confidentialité
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
          Dernière mise à jour : mars 2025
        </p>

        <div className="stack-lg" style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-muted)' }}>
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              1. Données collectées
            </h2>
            <p>Nous collectons les données suivantes lors de votre inscription et utilisation :</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Adresse e-mail (obligatoire, non affichée publiquement)</li>
              <li>Nom d&apos;affichage (pseudo public)</li>
              <li>Contenus publiés (sujets, messages, réponses)</li>
              <li>Données de connexion (date, horodatage)</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              2. Utilisation des données
            </h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Gérer votre compte et authentifier votre identité</li>
              <li>Afficher vos contributions sur la Plateforme</li>
              <li>Assurer la sécurité et la modération de la communauté</li>
              <li>Vous contacter en cas de problème lié à votre compte</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              3. Partage des données
            </h2>
            <p>
              Nous ne vendons, ne louons et ne partageons jamais vos données personnelles avec des tiers
              à des fins commerciales. Les données peuvent être transmises aux autorités compétentes
              sur réquisition judiciaire.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              4. Sécurité
            </h2>
            <p>
              Vos mots de passe sont hashés et salés (PBKDF2). Nous utilisons HTTPS pour toutes
              les communications. L&apos;accès aux données est restreint au personnel autorisé.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              5. Vos droits (RGPD)
            </h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Droit d&apos;accès à vos données personnelles</li>
              <li>Droit de rectification des données inexactes</li>
              <li>Droit à l&apos;effacement («&nbsp;droit à l&apos;oubli&nbsp;»)</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d&apos;opposition au traitement</li>
            </ul>
            <p style={{ marginTop: 10 }}>
              Pour exercer ces droits, contactez :
              <span style={{ color: 'var(--primary)', marginLeft: 6 }}>privacy@communaute.fr</span>
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              6. Conservation des données
            </h2>
            <p>
              Vos données sont conservées pendant la durée de vie de votre compte et jusqu&apos;à
              3 ans après sa suppression pour des raisons légales. Vous pouvez demander la
              suppression immédiate en nous contactant.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              7. Cookies
            </h2>
            <p>
              Nous utilisons uniquement les cookies strictement nécessaires au fonctionnement
              de la Plateforme (authentification de session). Aucun cookie de tracking tiers
              n&apos;est utilisé.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
