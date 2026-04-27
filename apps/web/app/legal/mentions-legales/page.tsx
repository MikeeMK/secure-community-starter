import Link from 'next/link';

export default function PageMentionsLegales() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/" className="btn btn-ghost btn-sm">&larr; Accueil</Link>
      </div>

      <div className="card card-lg">
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Mentions Légales
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
          Dernière mise à jour : avril 2026
        </p>

        <div className="stack-lg" style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-muted)' }}>
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              1. Éditeur du site
            </h2>
            <p>
              Le présent site est édité par :<br />
              <strong style={{ color: 'var(--text)' }}>Velentra</strong><br />
              Siège social : France<br />
              SIRET : [À COMPLÉTER]<br />
              Email : <span style={{ color: 'var(--primary)' }}>contact@velentra.fr</span>
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              2. Directeur de la publication
            </h2>
            <p>
              Le directeur de la publication est le représentant légal de Velentra (éditeur du site).<br />
              Contact : <span style={{ color: 'var(--primary)' }}>direction@velentra.fr</span>
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              3. Hébergement
            </h2>
            <p>
              Le site est hébergé par :<br />
              <strong style={{ color: 'var(--text)' }}>Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
              Site web : vercel.com
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              4. Propriété intellectuelle
            </h2>
            <p>
              L&apos;ensemble des contenus présents sur ce site (textes, graphismes, logos, images,
              icônes, sons, logiciels) est la propriété exclusive de Velentra, sauf mentions
              contraires. Toute reproduction, distribution, modification ou publication est interdite
              sans autorisation écrite préalable.
            </p>
            <p style={{ marginTop: 10 }}>
              Les contenus publiés par les utilisateurs restent leur propriété. En les publiant sur
              la Plateforme, ils accordent à Velentra une licence non exclusive d&apos;affichage
              et de diffusion sur la Plateforme.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              5. Données personnelles
            </h2>
            <p>
              Le traitement des données personnelles des utilisateurs est décrit dans notre{' '}
              <Link href="/legal/privacy" style={{ color: 'var(--primary)' }}>
                Politique de Confidentialité
              </Link>
              . Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
              d&apos;un droit d&apos;accès, de rectification et de suppression de vos données.
            </p>
            <p style={{ marginTop: 10 }}>
              Délégué à la Protection des Données :{' '}
              <span style={{ color: 'var(--primary)' }}>privacy@velentra.fr</span>
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              6. Cookies
            </h2>
            <p>
              Le site utilise uniquement des cookies techniques strictement nécessaires au
              fonctionnement de la Plateforme (gestion de session). Aucun cookie publicitaire
              ou de tracking tiers n&apos;est déposé. Pour plus d&apos;informations, consultez notre{' '}
              <Link href="/legal/privacy" style={{ color: 'var(--primary)' }}>
                Politique de Confidentialité
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              7. Responsabilité
            </h2>
            <p>
              Velentra s&apos;efforce de maintenir des informations exactes et à jour. Cependant,
              elle ne saurait être tenue responsable des erreurs ou omissions, ni des dommages directs
              ou indirects résultant de l&apos;utilisation du site. Les liens hypertextes vers des sites
              tiers sont fournis à titre informatif ; Velentra n&apos;assume aucune responsabilité
              quant à leur contenu.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
              8. Droit applicable
            </h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. Tout litige relatif
              à leur interprétation ou exécution relève de la compétence exclusive des tribunaux
              français compétents.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
