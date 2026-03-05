import Link from 'next/link';

export function Footer() {
  const annee = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Logo */}
        <Link href="/" className="footer-logo">
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #0d9488, #2dd4bf)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
              color: '#042f2e',
            }}
          >
            C
          </span>
          Communauté
        </Link>

        {/* Liens légaux */}
        <div className="footer-links">
          <Link href="/legal/cgu" className="footer-link">CGU</Link>
          <Link href="/legal/privacy" className="footer-link">Confidentialité</Link>
          <Link href="/legal/mentions-legales" className="footer-link">Mentions légales</Link>
          <Link href="/connexion" className="footer-link">Connexion</Link>
          <Link href="/inscription" className="footer-link">Inscription</Link>
        </div>

        {/* Copyright */}
        <p className="footer-copy">
          &copy; {annee} Communauté — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
