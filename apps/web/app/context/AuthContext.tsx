'use client';

import React from 'react';
import { apiFetch, AUTH_TOKEN_STORAGE_KEY } from '../lib/api';

export type UtilisateurAuth = {
  id: string;
  displayName: string;
  email: string;
  trustLevel: string;
  isAdultVerified?: boolean;
};

interface AuthContextType {
  utilisateur: UtilisateurAuth | null;
  connecter: (utilisateur: UtilisateurAuth, token: string) => void;
  deconnecter: () => void;
  estAuthentifie: boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  utilisateur: null,
  connecter: () => {},
  deconnecter: () => {},
  estAuthentifie: false,
});

const USER_STORAGE_KEY = 'community_user';
const COOKIE_NAME = 'community_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function definirCookieAuth(token: string) {
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function supprimerCookieAuth() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utilisateur, setUtilisateur] = React.useState<UtilisateurAuth | null>(null);

  const clearAuth = React.useCallback(() => {
    setUtilisateur(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
    supprimerCookieAuth();
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) {
      clearAuth();
      return;
    }

    apiFetch<{ user: UtilisateurAuth }>('/auth/me')
      .then((result) => {
        setUtilisateur(result.user);
        definirCookieAuth(token);
      })
      .catch(() => {
        clearAuth();
      });
  }, [clearAuth]);

  // Ping the server every 5 minutes to update lastActiveAt
  React.useEffect(() => {
    if (!utilisateur) return;
    apiFetch('/auth/ping', { method: 'POST' }).catch(() => {});
    const id = setInterval(() => {
      apiFetch('/auth/ping', { method: 'POST' }).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [utilisateur]);

  const connecter = React.useCallback((user: UtilisateurAuth, token: string) => {
    setUtilisateur(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }
    definirCookieAuth(token);
  }, []);

  const deconnecter = React.useCallback(() => {
    clearAuth();
    window.location.href = '/';
  }, [clearAuth]);

  const valeur = React.useMemo(
    () => ({ utilisateur, connecter, deconnecter, estAuthentifie: utilisateur !== null }),
    [utilisateur, connecter, deconnecter]
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
