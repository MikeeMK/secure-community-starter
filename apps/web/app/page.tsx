import Link from 'next/link';

const MEMBRES = [
  { initiales: 'CL', nom: 'Claire', age: 27, ville: 'Paris',     gradient: 'linear-gradient(135deg, #f472b6, #ec4899)', online: true  },
  { initiales: 'AX', nom: 'Axel',   age: 30, ville: 'Lyon',      gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)', online: true  },
  { initiales: 'JU', nom: 'Julie',  age: 29, ville: 'Bordeaux',  gradient: 'linear-gradient(135deg, #fb923c, #f97316)', online: false },
  { initiales: 'MC', nom: 'Marc',   age: 35, ville: 'Marseille', gradient: 'linear-gradient(135deg, #34d399, #10b981)', online: true  },
];

const DISCUSSIONS = [
  { icon: '💬', iconBg: 'rgba(232,93,117,0.10)', titre: 'Comment faire de vraies rencontres en ligne ?', reponses: 523 },
  { icon: '✨', iconBg: 'rgba(79,143,139,0.10)',  titre: 'Vos expériences de premières rencontres',        reponses: 210 },
];

const GROUPES = [
  { icon: '👫', bg: 'rgba(232,93,117,0.12)', nom: 'Rencontres sérieuses', membres: 194 },
  { icon: '💬', bg: 'rgba(79,143,139,0.12)',  nom: 'Discussion libre',     membres: 289 },
  { icon: '💗', bg: 'rgba(244,114,182,0.12)', nom: 'Couples',              membres: 162 },
  { icon: '💡', bg: 'rgba(251,191,36,0.12)',  nom: 'Curieux / débutants',  membres: 118 },
];

export default function Accueil() {
  return (
    <div className="landing-root" style={{ margin: '-36px -24px -60px', padding: 0 }}>

      {/* ====================================================
          HÉROS SPLIT
          ==================================================== */}
      <section className="hero-split">
        <div className="hero-split-inner">

          {/* Texte gauche */}
          <div className="hero-split-text">
            <div className="hero-split-badge">
              <span className="landing-badge-dot" />
              Plateforme privée &amp; sécurisée
            </div>

            <h1 className="hero-split-title">
              Rencontrez des personnes<br />
              qui partagent <span style={{ color: 'var(--coral)' }}>vos envies</span>
            </h1>

            <p className="hero-split-subtitle">
              Une communauté intime pour discuter, explorer
              et faire des rencontres en toute sécurité.
            </p>

            <div className="hero-split-ctas">
              <Link href="/inscription" className="hero-split-btn-primary">
                Créer un compte
              </Link>
              <Link href="/forum" className="hero-split-btn-secondary">
                Explorer la communauté
              </Link>
            </div>

            {/* Preuve sociale */}
            <div className="landing-social-proof" style={{ marginTop: 32, justifyContent: 'flex-start' }}>
              <div className="landing-avatars">
                {MEMBRES.map((m, i) => (
                  <div key={i} className="landing-avatar" style={{ background: m.gradient, color: '#fff' }}>
                    {m.initiales[0]}
                  </div>
                ))}
                <div className="landing-avatar">+</div>
              </div>
              <span>Rejoignez des centaines de membres actifs</span>
            </div>
          </div>

          {/* Illustration droite */}
          <div className="hero-split-illustration">
            <div className="hero-blob" />

            {/* Cartes profil flottantes */}
            <div className="hero-profiles">
              {[MEMBRES[0], MEMBRES[1], MEMBRES[3]].map((m, i) => (
                <div key={i} className="hero-profile-card">
                  <div className="hero-profile-avatar" style={{ background: m.gradient }}>
                    {m.initiales}
                  </div>
                  <div className="hero-profile-name">{m.nom}, {m.age}</div>
                  <div className="hero-profile-city">{m.ville}</div>
                </div>
              ))}
            </div>

            {/* Bulle de chat flottante */}
            <div className="hero-float" style={{
              top: 80, right: 20,
              padding: '10px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>💬</span>
              <span style={{ color: 'var(--text-muted)' }}>Salut, ravie de te voir ici !</span>
            </div>

            {/* Cœur flottant */}
            <div className="hero-float" style={{
              top: 60, left: 30,
              padding: '10px 14px',
              borderRadius: 16,
              fontSize: 20,
            }}>
              ❤️
            </div>

            {/* Étoile flottante */}
            <div className="hero-float" style={{
              bottom: 80, right: 40,
              padding: '8px 14px',
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--coral)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ✨ Nouveau match !
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          MEMBRES PRÈS DE CHEZ VOUS
          ==================================================== */}
      <section className="members-section">
        <div className="members-section-header">
          <h2 className="members-section-title">Membres actifs</h2>
          <Link href="/forum" className="members-section-link">
            Voir plus de profils &rsaquo;
          </Link>
        </div>

        <div className="members-grid">
          {MEMBRES.map((m, i) => (
            <div key={i} className="member-card">
              <div className="member-avatar-photo" style={{ background: m.gradient }}>
                {m.initiales}
                {m.online && <span className="member-online-dot" />}
              </div>
              <div className="member-name">{m.nom}, {m.age}</div>
              <div className="member-city">{m.ville}</div>
              <Link href="/forum" className="btn-discuter">
                ♥ Discuter
              </Link>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link href="/forum" className="members-section-link">
            Voir plus de profils &rsaquo;
          </Link>
        </div>
      </section>

      {/* ====================================================
          DISCUSSIONS + GROUPES
          ==================================================== */}
      <div className="deux-colonnes-section">

        {/* Discussions populaires */}
        <div>
          <div className="col-section-header">
            <h2 className="col-section-title">Discussions populaires</h2>
            <Link href="/forum" className="col-section-link">Voir plus &rsaquo;</Link>
          </div>

          {DISCUSSIONS.map((d, i) => (
            <Link href="/forum" key={i} className="discussion-card">
              <div className="discussion-icon" style={{ background: d.iconBg, fontSize: 20 }}>
                {d.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="discussion-title">{d.titre}</div>
                <div className="discussion-replies">{d.reponses} réponses</div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex' }}>
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="landing-avatar" style={{
                      background: MEMBRES[j].gradient, color: '#fff',
                      marginLeft: j > 0 ? -8 : 0, fontSize: 9,
                    }}>
                      {MEMBRES[j].initiales[0]}
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Groupes actifs */}
        <div>
          <div className="col-section-header">
            <h2 className="col-section-title">Groupes actifs</h2>
            <Link href="/groupes" className="col-section-link">Voir plus &rsaquo;</Link>
          </div>

          <div className="groups-mini-grid">
            {GROUPES.map((g, i) => (
              <Link href="/groupes" key={i} className="group-card-mini">
                <div className="group-icon-circle" style={{ background: g.bg }}>
                  {g.icon}
                </div>
                <div>
                  <div className="group-card-mini-name">{g.nom}</div>
                  <div className="group-card-mini-members">{g.membres} membres</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================
          SÉCURITÉ ET MODÉRATION
          ==================================================== */}
      <section className="securite-section">
        <div className="securite-inner">
          <div>
            <h2 className="securite-title">Sécurité et modération</h2>
            <div className="securite-items">
              {[
                'Modération active des contenus',
                'Signalement des comportements',
                'Profils vérifiés, pas de bots',
                'Confidentialité totale de vos données',
              ].map((item, i) => (
                <div key={i} className="securite-item">
                  <div className="securite-check">✓</div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="securite-illo">🛡️</div>
        </div>
      </section>

      {/* ====================================================
          CTA FINAL
          ==================================================== */}
      <div className="landing-divider" />
      <div className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">
            Rejoignez la communauté<br />dès maintenant
          </h2>
          <p className="cta-subtitle">
            Inscription gratuite. Aucune carte bancaire requise.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/inscription" className="btn-landing-primary">
              Créer un compte
            </Link>
            <Link href="/connexion" className="btn-landing-secondary">
              J&apos;ai déjà un compte
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-dim)' }}>
            En vous inscrivant, vous acceptez nos{' '}
            <Link href="/legal/cgu" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>CGU</Link>
            {' '}et notre{' '}
            <Link href="/legal/privacy" style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
