'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { ThemeToggle } from './ThemeToggle';

const liens = [
  { href: '/', label: 'Accueil', exact: true },
  { href: '/forum', label: 'Forum', exact: false },
  { href: '/groupes', label: 'Groupes', exact: false },
  { href: '/admin/moderation', label: 'Modération', exact: false },
];

export function Nav() {
  const pathname = usePathname();
  const { utilisateur, deconnecter, estAuthentifie } = useAuth();

  function estActif(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        {/* Logo */}
        <Link href="/" className="nav-logo">
          <span className="nav-logo-icon">C</span>
          Communauté
        </Link>

        {/* Liens principaux */}
        <div className="nav-links">
          {liens.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className={`nav-link ${estActif(lien.href, lien.exact) ? 'active' : ''}`}
            >
              {lien.label}
            </Link>
          ))}
        </div>

        {/* Actions à droite */}
        <div className="nav-actions">
          <ThemeToggle />
          {estAuthentifie && utilisateur ? (
            <div className="nav-user">
              <Avatar name={utilisateur.displayName} size="sm" />
              <span className="nav-user-name">{utilisateur.displayName}</span>
              <button className="nav-logout-btn" onClick={deconnecter}>
                Déconnexion
              </button>
            </div>
          ) : (
            <>
              <Link href="/connexion" className="btn btn-ghost btn-sm">
                Connexion
              </Link>
              <Link href="/inscription" className="btn btn-primary btn-sm">
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
