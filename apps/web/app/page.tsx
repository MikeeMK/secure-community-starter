import Link from 'next/link';

export default function Accueil() {
  return (
    <div className="landing-root" style={{ margin: '-36px -24px -60px', padding: 0 }}>

      {/* ====================================================
          HÉROS
          ==================================================== */}
      <section className="landing-hero">
        {/* Orbs de fond */}
        <div className="orb-container">
          <div className="orb orb-teal" style={{ width: 700, height: 700, top: '-200px', left: '50%', transform: 'translateX(-60%)' }} />
          <div className="orb orb-purple" style={{ width: 500, height: 500, top: '100px', right: '-100px' }} />
          <div className="orb orb-cyan" style={{ width: 400, height: 400, bottom: '-50px', left: '-80px' }} />
        </div>

        <div className="landing-hero-content">
          {/* Badge animé */}
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            Plateforme privée &amp; sécurisée
          </div>

          {/* Titre principal */}
          <h1 className="landing-title">
            Rencontrez, échangez<br />
            <span className="grad-teal">et explorez</span>{' '}
            <span className="grad-purple">librement</span>
          </h1>

          {/* Sous-titre */}
          <p className="landing-subtitle">
            Une communauté moderne pour discuter, partager et créer
            des connexions authentiques — dans un espace privé, modéré et respectueux.
          </p>

          {/* CTA */}
          <div className="landing-cta-group">
            <Link href="/inscription" className="btn-landing-primary">
              Créer un compte gratuit
            </Link>
            <Link href="/connexion" className="btn-landing-secondary">
              Se connecter
            </Link>
          </div>

          {/* Preuve sociale */}
          <div className="landing-social-proof">
            <div className="landing-avatars">
              {['A', 'M', 'L', 'S', 'K'].map((l, i) => (
                <div key={i} className="landing-avatar">{l}</div>
              ))}
            </div>
            <span>Rejoignez des centaines de membres actifs</span>
          </div>
        </div>
      </section>

      <div className="landing-divider" />

      {/* ====================================================
          POURQUOI NOUS REJOINDRE
          ==================================================== */}
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <section className="landing-section">
          <div className="landing-section-header">
            <span className="landing-section-label">Pourquoi nous rejoindre</span>
            <h2 className="landing-section-title">
              Une plateforme pensée<br />pour votre liberté
            </h2>
            <p className="landing-section-subtitle">
              Nous avons conçu chaque fonctionnalité pour que vous puissiez vous exprimer librement,
              en toute sécurité.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              {
                icon: '&#x1F510;',
                iconClass: 'glass-icon-teal',
                titre: 'Profils vérifiés',
                desc: 'Chaque membre est contrôlé. Pas de bots, pas de faux comptes — une communauté authentique.',
              },
              {
                icon: '&#x1F4AC;',
                iconClass: 'glass-icon-purple',
                titre: 'Discussions thématiques',
                desc: 'Des espaces de discussion organisés par thème pour des conversations riches et ciblées.',
              },
              {
                icon: '&#x1F465;',
                iconClass: 'glass-icon-cyan',
                titre: 'Groupes privés',
                desc: "Créez ou rejoignez des groupes fermés autour d'intérêts spécifiques, accessibles sur invitation.",
              },
              {
                icon: '&#x1F6E1;&#xFE0F;',
                iconClass: 'glass-icon-amber',
                titre: 'Modération active',
                desc: 'Une équipe et des outils de signalement veillent au respect de chaque membre, 24h/24.',
              },
            ].map((item, i) => (
              <div key={i} className="glass-card" style={{ padding: '28px' }}>
                <div className={`glass-icon ${item.iconClass}`} dangerouslySetInnerHTML={{ __html: item.icon }} />
                <div className="feature-title" style={{ color: '#f1f5f9' }}>{item.titre}</div>
                <p className="feature-desc" style={{ color: '#64748b' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ====================================================
            COMMENT CA MARCHE
            ==================================================== */}
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <span className="landing-section-label">En 3 étapes</span>
            <h2 className="landing-section-title">Comment ça marche</h2>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="step-grid">
              {[
                {
                  n: '1',
                  titre: 'Créez votre profil',
                  desc: 'Inscrivez-vous en 2 minutes, définissez votre pseudo et vos préférences de confidentialité.',
                },
                {
                  n: '2',
                  titre: 'Rejoignez des espaces',
                  desc: "Explorez le forum, intégrez des groupes privés et participez aux discussions qui vous correspondent.",
                },
                {
                  n: '3',
                  titre: 'Créez des connexions',
                  desc: "Échangez avec des membres partageant vos intérêts et construisez des relations authentiques.",
                },
              ].map((step, i) => (
                <div key={i} className="step-card">
                  <div className="step-number">{step.n}</div>
                  <div className="step-title">{step.titre}</div>
                  <p className="step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================
            FONCTIONNALITÉS DE LA COMMUNAUTÉ
            ==================================================== */}
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <span className="landing-section-label">La plateforme</span>
            <h2 className="landing-section-title">Tout ce qu&apos;il vous faut</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: '&#x1F4DD;', label: 'Forum de discussions', color: '#2dd4bf' },
              { icon: '&#x1F465;', label: 'Groupes thématiques', color: '#a78bfa' },
              { icon: '&#x1F464;', label: 'Profils membres', color: '#67e8f9' },
              { icon: '&#x1F512;', label: 'Espaces privés', color: '#f59e0b' },
              { icon: '&#x1F4E8;', label: 'Messagerie (bientôt)', color: '#94a3b8' },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card"
                style={{ padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 12, opacity: item.color === '#94a3b8' ? 0.5 : 1 }}
              >
                <span style={{ fontSize: 22 }} dangerouslySetInnerHTML={{ __html: item.icon }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: item.color }}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ====================================================
            SECTION SÉCURITÉ
            ==================================================== */}
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <div className="safety-section">
            <div className="landing-section-header" style={{ marginBottom: 40 }}>
              <span className="landing-section-label">Votre sécurité d&apos;abord</span>
              <h2 className="landing-section-title" style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}>
                Un espace que vous pouvez<br />vraiment faire confiance
              </h2>
            </div>

            <div className="safety-grid">
              {[
                {
                  titre: 'Signalement facile',
                  desc: "Signalez tout contenu inapproprié en un clic. Notre équipe intervient rapidement.",
                },
                {
                  titre: 'Modération humaine',
                  desc: "Des modérateurs réels examinent chaque signalement — pas uniquement des algorithmes.",
                },
                {
                  titre: 'Confidentialité totale',
                  desc: "Vos données personnelles ne sont jamais vendues ni partagées avec des tiers.",
                },
                {
                  titre: 'Respect des membres',
                  desc: "Charte de conduite stricte. Les comportements irrespectueux entraînent une suspension immédiate.",
                },
              ].map((item, i) => (
                <div key={i} className="safety-item">
                  <div className="safety-check">&#x2714;</div>
                  <div>
                    <div className="safety-text-title">{item.titre}</div>
                    <p className="safety-text-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ====================================================
          CTA FINAL
          ==================================================== */}
      <div className="landing-divider" />
      <div className="cta-section">
        <div className="orb-container" style={{ position: 'absolute' }}>
          <div className="orb orb-teal" style={{ width: 600, height: 300, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        </div>
        <div className="cta-content">
          <h2 className="cta-title">
            Rejoignez la communauté<br />dès maintenant
          </h2>
          <p className="cta-subtitle">
            Inscription gratuite. Aucune carte bancaire requise.
            Commencez à explorer et à vous connecter.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/inscription" className="btn-landing-primary">
              Créer un compte
            </Link>
            <Link href="/connexion" className="btn-landing-secondary">
              J&apos;ai déjà un compte
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: '#334155' }}>
            En vous inscrivant, vous acceptez nos{' '}
            <Link href="/legal/cgu" style={{ color: '#475569', textDecoration: 'underline' }}>CGU</Link>
            {' '}et notre{' '}
            <Link href="/legal/privacy" style={{ color: '#475569', textDecoration: 'underline' }}>politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
