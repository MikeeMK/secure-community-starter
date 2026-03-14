'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { apiFetch, AUTH_TOKEN_STORAGE_KEY } from '../lib/api';

type Tab = 'profil' | 'password' | 'confidentialite';

type AccountData = {
  displayName: string;
  email: string;
  displayNameUpdatedAt: string | null;
  isAdultVerified: boolean;
  adultVerifiedAt: string | null;
  settings: {
    allowChat: boolean;
    hideFromSuggestions: boolean;
    allowNotifLikes: boolean;
  } | null;
};

type Settings = {
  allowChat: boolean;
  hideFromSuggestions: boolean;
  allowNotifLikes: boolean;
};

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function daysUntilNextChange(updatedAt: string | null): number | null {
  if (!updatedAt) return null;
  const next = new Date(updatedAt).getTime() + COOLDOWN_MS;
  const diff = next - Date.now();
  if (diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        style={{
          width: 44,
          height: 24,
          borderRadius: 99,
          border: 'none',
          cursor: 'pointer',
          background: checked ? 'var(--primary)' : 'var(--surface-3)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginLeft: 16,
        }}
      >
        <span style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

function ComptePageInner() {
  const { utilisateur, estAuthentifie, connecter } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get('tab') as Tab) ?? 'profil';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [account, setAccount] = useState<AccountData | null>(null);

  // Profil tab state
  const [displayName, setDisplayName] = useState('');
  const [displayNameLoading, setDisplayNameLoading] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameSuccess, setDisplayNameSuccess] = useState(false);
  const [adultVerificationLoading, setAdultVerificationLoading] = useState(false);
  const [adultVerificationError, setAdultVerificationError] = useState<string | null>(null);
  const [adultVerificationSuccess, setAdultVerificationSuccess] = useState(false);

  // Password tab state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Settings tab state
  const [settings, setSettings] = useState<Settings>({ allowChat: true, hideFromSuggestions: false, allowNotifLikes: true });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    if (!estAuthentifie) { router.push('/connexion'); return; }
    apiFetch<AccountData>('/account').then((data) => {
      setAccount(data);
      setDisplayName(data.displayName);
      if (data.settings) setSettings(data.settings);
    }).catch(() => {});
    apiFetch<Settings>('/account/settings').then((s) => setSettings(s)).catch(() => {});
  }, [estAuthentifie, router]);

  const daysLeft = account ? daysUntilNextChange(account.displayNameUpdatedAt) : null;
  const canChangeDisplayName = daysLeft === null;

  async function handleDisplayName(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setDisplayNameLoading(true);
    setDisplayNameError(null);
    setDisplayNameSuccess(false);
    try {
      await apiFetch('/account/display-name', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      setDisplayNameSuccess(true);
      setAccount((prev) => prev ? { ...prev, displayName: displayName.trim(), displayNameUpdatedAt: new Date().toISOString() } : prev);
      setTimeout(() => setDisplayNameSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      setDisplayNameError(msg);
    } finally {
      setDisplayNameLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPasswordError('Les mots de passe ne correspondent pas'); return; }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await apiFetch('/account/password', {
        method: 'PATCH',
        body: JSON.stringify({ newPassword }),
      });
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleAdultVerificationOverride() {
    setAdultVerificationLoading(true);
    setAdultVerificationError(null);
    setAdultVerificationSuccess(false);

    try {
      const result = await apiFetch<{
        user: {
          id: string;
          displayName: string;
          email: string;
          trustLevel: string;
          isAdultVerified: boolean;
        };
      }>('/account/adult-verification/dev-override', {
        method: 'PATCH',
      });

      setAccount((prev) => prev ? {
        ...prev,
        isAdultVerified: true,
        adultVerifiedAt: new Date().toISOString(),
      } : prev);
      setAdultVerificationSuccess(true);

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        if (token) {
          connecter(result.user, token);
        }
      }
    } catch (err: unknown) {
      setAdultVerificationError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setAdultVerificationLoading(false);
    }
  }

  async function saveSettings(updated: Settings) {
    setSettings(updated);
    setSettingsSaving(true);
    setSettingsSuccess(false);
    try {
      await apiFetch('/account/settings', {
        method: 'PATCH',
        body: JSON.stringify(updated),
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2000);
    } finally {
      setSettingsSaving(false);
    }
  }

  if (!utilisateur || !account) return <div className="loading-text">Chargement…</div>;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profil', label: 'Profil' },
    { id: 'password', label: 'Mot de passe' },
    { id: 'confidentialite', label: 'Confidentialité' },
  ];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Mon compte</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{account.email}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: 28 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profil ── */}
      {tab === 'profil' && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Nom d'affichage</h2>
          <form onSubmit={handleDisplayName} className="stack">
            <div className="form-group">
              <label className="form-label">Nom visible par les autres membres</label>
              <input
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                minLength={2}
                maxLength={32}
                required
                disabled={!canChangeDisplayName}
                placeholder="Votre pseudo"
              />
              {daysLeft !== null && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Prochain changement possible dans <strong>{daysLeft} jour{daysLeft > 1 ? 's' : ''}</strong>
                </p>
              )}
              {canChangeDisplayName && account.displayNameUpdatedAt && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Prochain changement possible dans 7 jours après modification.
                </p>
              )}
              {!account.displayNameUpdatedAt && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Première modification gratuite — ensuite, un délai de 7 jours s'applique.
                </p>
              )}
            </div>
            {displayNameError && <div className="error-text">{displayNameError}</div>}
            {displayNameSuccess && <div style={{ color: 'var(--success, #22c55e)', fontSize: 13, fontWeight: 600 }}>Nom mis à jour !</div>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={displayNameLoading || !canChangeDisplayName || displayName.trim() === account.displayName}
              style={{ alignSelf: 'flex-start' }}
            >
              {displayNameLoading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Vérification d'âge</h2>
            {account.isAdultVerified ? (
              <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                Compte vérifié{account.adultVerifiedAt ? ` le ${new Date(account.adultVerifiedAt).toLocaleDateString('fr-FR')}` : ''}.
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
                  La vérification réelle n'est pas encore branchée. Ce bouton applique un override local au compte actuellement connecté, uniquement hors production.
                </p>
                {adultVerificationError && <div className="error-text" style={{ marginBottom: 10 }}>{adultVerificationError}</div>}
                {adultVerificationSuccess && !adultVerificationError && (
                  <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, marginBottom: 10 }}>
                    Compte marqué comme vérifié.
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={adultVerificationLoading}
                  onClick={handleAdultVerificationOverride}
                >
                  {adultVerificationLoading ? 'Application…' : 'Marquer mon compte comme vérifié'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Mot de passe ── */}
      {tab === 'password' && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Changer le mot de passe</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Choisissez un mot de passe fort d'au moins 8 caractères.
          </p>
          <form onSubmit={handlePassword} className="stack">
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required minLength={8} maxLength={128}
                  placeholder="8 caractères minimum"
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
                >
                  {showNew ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required minLength={8}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
                >
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>Les mots de passe ne correspondent pas</p>
              )}
            </div>
            {passwordError && <div className="error-text">{passwordError}</div>}
            {passwordSuccess && <div style={{ color: 'var(--success, #22c55e)', fontSize: 13, fontWeight: 600 }}>Mot de passe mis à jour !</div>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
              style={{ alignSelf: 'flex-start' }}
            >
              {passwordLoading ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      )}

      {/* ── Confidentialité ── */}
      {tab === 'confidentialite' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Confidentialité & options</h2>
            {settingsSaving && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Sauvegarde…</span>}
            {settingsSuccess && !settingsSaving && <span style={{ fontSize: 12, color: 'var(--success, #22c55e)', fontWeight: 600 }}>Sauvegardé ✓</span>}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Ces préférences s'appliquent immédiatement.
          </p>

          <Toggle
            label="Autoriser le chat direct"
            description="Si désactivé, aucun membre ne pourra initier une nouvelle conversation de chat avec vous."
            checked={settings.allowChat}
            onChange={(v) => saveSettings({ ...settings, allowChat: v })}
          />
          <Toggle
            label="Apparaître dans les suggestions de membres"
            description="Votre profil peut être affiché aux autres membres dans le widget 'Membres suggérés'."
            checked={!settings.hideFromSuggestions}
            onChange={(v) => saveSettings({ ...settings, hideFromSuggestions: !v })}
          />
          <Toggle
            label="Notifications de j'aime"
            description="Recevoir une notification quand quelqu'un aime votre annonce."
            checked={settings.allowNotifLikes}
            onChange={(v) => saveSettings({ ...settings, allowNotifLikes: v })}
          />

          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-muted)' }}>
            💡 <strong>Note :</strong> les conversations ouvertes depuis une annonce restent toujours accessibles, même si le chat direct est désactivé.
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComptePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Chargement…</div>}>
      <ComptePageInner />
    </Suspense>
  );
}
