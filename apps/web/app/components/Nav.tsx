'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { ThemeToggle } from './ThemeToggle';
import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const liensPublics = [
  { href: '/', label: 'Accueil', exact: true },
  { href: '/forum', label: 'Forum', exact: false },
  { href: '/annonces', label: 'Annonces', exact: false },
  { href: '/groupes', label: 'Groupes', exact: false },
  { href: '/faq', label: 'FAQ', exact: false },
];

function isStaff(trustLevel?: string) {
  return trustLevel === 'moderator' || trustLevel === 'super_admin';
}

export function Nav() {
  const pathname = usePathname();
  const { utilisateur, deconnecter, estAuthentifie, authResolved } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!estAuthentifie) return;
    apiFetch<{ id: string; read: boolean }[]>('/notifications')
      .then((notifs) => setUnreadCount(notifs.filter((n) => !n.read).length))
      .catch(() => {});
  }, [estAuthentifie, pathname]);

  function estActif(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        {/* Logo */}
        <Link href="/" className="nav-logo">
          <span className="logo-text">Velentra</span>
        </Link>

        {/* Liens principaux */}
        <div className="nav-links">
          {liensPublics.map((lien) => (
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
          {!authResolved ? null : estAuthentifie && utilisateur ? (
            <div className="nav-user-menu" ref={menuRef}>
              <button className="nav-user-trigger" onClick={() => setMenuOpen((v) => !v)}>
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <Avatar name={utilisateur.displayName} size="sm" />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: 'var(--danger)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 99,
                      minWidth: 16,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      lineHeight: 1,
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="nav-user-name">{utilisateur.displayName}</span>
                <svg className={`nav-chevron${menuOpen ? ' open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {menuOpen && (
                <div className="nav-dropdown">
                  <Link href="/dashboard" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <span>🏠</span> Tableau de bord
                  </Link>
                  <Link href="/compte" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <span>⚙️</span> Paramètres
                  </Link>
                  {isStaff(utilisateur.trustLevel) && (
                    <>
                      <div className="nav-dropdown-divider" />
                      <Link href="/admin/moderation" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
                        <span>🛡️</span> Modération
                      </Link>
                    </>
                  )}
                  <div className="nav-dropdown-divider" />
                  <button className="nav-dropdown-item nav-dropdown-danger" onClick={() => { setMenuOpen(false); deconnecter(); }}>
                    <span>🚪</span> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/connexion" className="btn btn-ghost btn-sm">
                Connexion
              </Link>
              <Link href="/inscription" className="btn btn-coral btn-sm">
                S&apos;inscrire
              </Link>
            </>
          )}
          <span className="nav-divider" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
