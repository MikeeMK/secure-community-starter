import Link from 'next/link';

export default function PageCGU() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/" className="btn btn-ghost btn-sm">&larr; Accueil</Link>
      </div>

      <div className="card card-lg">
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Conditions Générales d&apos;Utilisation
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
          Dernière mise à jour : mars 2025
        </p>

        <div className="stack-lg" style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-muted)' }}>
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              1. Objet
            </h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (ci-après «&nbsp;CGU&nbsp;») régissent l&apos;accès et l&apos;utilisation
              de la plateforme Communauté (ci-après «&nbsp;la Plateforme&nbsp;»). En accédant à la Plateforme, vous acceptez
              sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              2. Accès et inscription
            </h2>
            <p>
              L&apos;inscription est réservée aux personnes majeures (18 ans et plus). Vous vous engagez à fournir
              des informations exactes lors de votre inscription et à maintenir ces informations à jour.
              Toute inscription frauduleuse entraînera la suppression immédiate du compte.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              3. Règles de conduite
            </h2>
            <p>Il est strictement interdit de :</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Publier des contenus illégaux, haineux, ou portant atteinte à la dignité d&apos;autrui</li>
              <li>Harceler, menacer ou intimider d&apos;autres membres</li>
              <li>Diffuser des informations personnelles d&apos;un tiers sans son consentement</li>
              <li>Utiliser la Plateforme à des fins commerciales non autorisées</li>
              <li>Créer des comptes multiples ou usurper l&apos;identité d&apos;une autre personne</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              4. Modération
            </h2>
            <p>
              La Plateforme dispose d&apos;un système de signalement et d&apos;une équipe de modération active.
              Tout contenu ou comportement contraire aux présentes CGU peut entraîner la suppression
              du contenu et/ou la suspension ou suppression du compte, sans préavis.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              5. Propriété intellectuelle
            </h2>
            <p>
              Les contenus publiés sur la Plateforme restent la propriété de leurs auteurs. En publiant
              un contenu, vous accordez à la Plateforme une licence non-exclusive d&apos;utilisation à des fins
              de fonctionnement du service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              6. Limitation de responsabilité
            </h2>
            <p>
              La Plateforme ne saurait être tenue responsable des contenus publiés par les membres ni
              des interactions entre membres. L&apos;utilisation de la Plateforme se fait sous votre entière
              responsabilité.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              7. Modifications
            </h2>
            <p>
              Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les modifications
              prennent effet dès leur publication. La poursuite de l&apos;utilisation de la Plateforme vaut
              acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              8. Contact
            </h2>
            <p>
              Pour toute question relative aux présentes CGU, contactez-nous à l&apos;adresse :
              <span style={{ color: 'var(--primary)', marginLeft: 6 }}>legal@communaute.fr</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
