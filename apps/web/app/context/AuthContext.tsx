'use client';

import React from 'react';
import { apiFetch } from '../lib/api';

export type UtilisateurAuth = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  trustLevel: string;
  isAdultVerified?: boolean;
  accountStatus?: string;
  moderationReason?: string | null;
  suspendedUntil?: string | null;
  canReRegisterAfter?: string | null;
  chatRestrictedUntil?: string | null;
  chatRestrictionReason?: string | null;
  publishRestrictedUntil?: string | null;
  publishRestrictionReason?: string | null;
  replyRestrictedUntil?: string | null;
  replyRestrictionReason?: string | null;
};

interface AuthContextType {
  utilisateur: UtilisateurAuth | null;
  connecter: (utilisateur: UtilisateurAuth) => void;
  deconnecter: () => void;
  estAuthentifie: boolean;
  authResolved: boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  utilisateur: null,
  connecter: () => {},
  deconnecter: () => {},
  estAuthentifie: false,
  authResolved: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utilisateur, setUtilisateur] = React.useState<UtilisateurAuth | null>(null);
  const [authResolved, setAuthResolved] = React.useState(false);

  const clearAuth = React.useCallback(() => {
    setUtilisateur(null);
  }, []);

  React.useEffect(() => {
    apiFetch<{ user: UtilisateurAuth }>('/auth/me')
      .then((result) => {
        setUtilisateur(result.user);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setAuthResolved(true);
      });
  }, [clearAuth]);

  React.useEffect(() => {
    if (!utilisateur) return;

    // Refresh the JWT every 20 minutes so the session never expires silently.
    // On failure (401), clear the local auth state so the UI reflects reality.
    async function doRefresh() {
      try {
        const result = await apiFetch<{ user: UtilisateurAuth }>('/api/session/refresh', { method: 'POST' });
        setUtilisateur(result.user);
      } catch {
        clearAuth();
        setAuthResolved(true);
      }
    }

    const id = setInterval(doRefresh, 20 * 60 * 1000);
    return () => clearInterval(id);
  }, [utilisateur, clearAuth]);

  const connecter = React.useCallback((user: UtilisateurAuth) => {
    setUtilisateur(user);
    setAuthResolved(true);
  }, []);

  const deconnecter = React.useCallback(() => {
    fetch('/api/session/logout', { method: 'POST' })
      .catch(() => {})
      .finally(() => {
        clearAuth();
        setAuthResolved(true);
        window.location.href = '/';
      });
  }, [clearAuth]);

  const valeur = React.useMemo(
    () => ({
      utilisateur,
      connecter,
      deconnecter,
      estAuthentifie: utilisateur !== null,
      authResolved,
    }),
    [utilisateur, connecter, deconnecter, authResolved],
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
