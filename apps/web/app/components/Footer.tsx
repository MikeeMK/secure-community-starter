import Link from 'next/link';

export function Footer() {
  const annee = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
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
          &copy; {annee} Velentra — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
