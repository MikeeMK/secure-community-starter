'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

type Tab = 'profil' | 'password' | 'confidentialite' | 'donnees';

type AccountData = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  displayNameUpdatedAt: string | null;
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';
  moderationReason?: string | null;
  suspendedUntil?: string | null;
  canReRegisterAfter?: string | null;
  chatRestrictedUntil?: string | null;
  chatRestrictionReason?: string | null;
  publishRestrictedUntil?: string | null;
  publishRestrictionReason?: string | null;
  replyRestrictedUntil?: string | null;
  replyRestrictionReason?: string | null;
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

type ActiveRestriction = {
  title: string;
  until: string;
  reason: string | null | undefined;
  tone: string;
};

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function daysUntilNextChange(updatedAt: string | null): number | null {
  if (!updatedAt) return null;
  const next = new Date(updatedAt).getTime() + COOLDOWN_MS;
  const diff = next - Date.now();
  if (diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  const { utilisateur, estAuthentifie, authResolved, connecter } = useAuth();
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);

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

  // Données & RGPD tab state
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');

  useEffect(() => {
    if (!authResolved) return;
    if (!estAuthentifie) { router.push('/connexion'); return; }
    apiFetch<AccountData>('/account').then((data) => {
      setAccount(data);
      setDisplayName(data.displayName);
      setAvatarPreview(data.avatarUrl);
      if (data.settings) setSettings(data.settings);
    }).catch(() => {});
    apiFetch<Settings>('/account/settings').then((s) => setSettings(s)).catch(() => {});
  }, [authResolved, estAuthentifie, router]);

  const daysLeft = account ? daysUntilNextChange(account.displayNameUpdatedAt) : null;
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

  async function handleAvatarSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Le fichier doit être une image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('L avatar ne doit pas dépasser 5 Mo.');
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);
    setAvatarSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file0', file);
      const uploadRes = await fetch('/api/uploads', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        throw new Error('Upload avatar impossible.');
      }

      const uploadJson = (await uploadRes.json()) as { urls?: string[] };
      const nextAvatarUrl = uploadJson.urls?.[0];
      if (!nextAvatarUrl) {
        throw new Error('Aucune image exploitable n a ete retournee.');
      }

      const updatedUser = await apiFetch<{
        id: string;
        email: string;
        displayName: string;
        avatarUrl: string | null;
        trustLevel: string;
        isAdultVerified?: boolean;
      }>('/account/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: nextAvatarUrl }),
      });

      setAccount((prev) => prev ? { ...prev, avatarUrl: updatedUser.avatarUrl } : prev);
      setAvatarPreview(updatedUser.avatarUrl);
      connecter(updatedUser);
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 2500);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Erreur avatar');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  }

  async function handleAvatarRemoval() {
    setAvatarUploading(true);
    setAvatarError(null);
    setAvatarSuccess(false);
    try {
      const updatedUser = await apiFetch<{
        id: string;
        email: string;
        displayName: string;
        avatarUrl: string | null;
        trustLevel: string;
        isAdultVerified?: boolean;
      }>('/account/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: null }),
      });

      setAccount((prev) => prev ? { ...prev, avatarUrl: null } : prev);
      setAvatarPreview(null);
      connecter(updatedUser);
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 2500);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Erreur avatar');
    } finally {
      setAvatarUploading(false);
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

  if (!authResolved || !utilisateur || !account) return <div className="loading-text">Chargement…</div>;

  const canChangeDisplayName = daysLeft === null;
  const activeRestrictions: ActiveRestriction[] = [
    account.suspendedUntil
      ? {
          title: 'Compte suspendu',
          until: account.suspendedUntil,
          reason: account.moderationReason,
          tone: 'var(--danger)',
        }
      : null,
    account.chatRestrictedUntil
      ? {
          title: 'Messagerie restreinte',
          until: account.chatRestrictedUntil,
          reason: account.chatRestrictionReason,
          tone: 'var(--warning)',
        }
      : null,
    account.publishRestrictedUntil
      ? {
          title: 'Publication restreinte',
          until: account.publishRestrictedUntil,
          reason: account.publishRestrictionReason,
          tone: 'var(--warning)',
        }
      : null,
    account.replyRestrictedUntil
      ? {
          title: 'Réponses restreintes',
          until: account.replyRestrictedUntil,
          reason: account.replyRestrictionReason,
          tone: 'var(--warning)',
        }
      : null,
  ].filter(Boolean) as ActiveRestriction[];

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch('/api/backend/account/export', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export impossible');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `velentra-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export impossible pour le moment, réessayez plus tard.');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'SUPPRIMER') return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiFetch('/account', { method: 'DELETE' });
      await fetch('/api/session/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profil', label: 'Profil' },
    { id: 'password', label: 'Mot de passe' },
    { id: 'confidentialite', label: 'Confidentialité' },
    { id: 'donnees', label: 'Données & RGPD' },
  ];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Mon compte</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{account.email}</p>
      </div>

      {activeRestrictions.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            padding: 18,
            border: '1px solid rgba(245, 158, 11, 0.25)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(239, 68, 68, 0.05))',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>
            Restrictions actives
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {activeRestrictions.map((restriction) => (
              <div key={`${restriction.title}-${restriction.until}`} style={{ padding: 12, borderRadius: 12, background: 'rgba(15, 23, 42, 0.28)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: restriction.tone }}>{restriction.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>
                  Jusqu au {formatDateTime(restriction.until)}
                  {restriction.reason ? ` · ${restriction.reason}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Photo de profil</h2>
          <div style={{ display: 'grid', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--border)', background: 'var(--surface-2)', position: 'relative', flexShrink: 0 }}>
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={`Avatar de ${account.displayName}`}
                    fill
                    unoptimized
                    sizes="110px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, color: 'var(--primary)' }}>
                    {account.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: 8, flex: 1, minWidth: 260 }}>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Importez l avatar de votre choix tant qu il reste propre, non offensant et conforme aux regles de la communaute.
                </div>
                <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700, lineHeight: 1.7 }}>
                  Interdiction absolue d utiliser un avatar avec nudite, contenu sexuel, pornographique, choquant ou offensant. Toute tentative peut entrainer une lourde sanction.
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarUploading ? 'Import en cours…' : 'Importer un avatar'}
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={avatarUploading}
                      onClick={handleAvatarRemoval}
                    >
                      Retirer l avatar
                    </button>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarSelection}
                />
                {avatarError && <div className="error-text">{avatarError}</div>}
                {avatarSuccess && (
                  <div style={{ color: 'var(--success, #22c55e)', fontSize: 13, fontWeight: 600 }}>
                    Avatar mis à jour !
                  </div>
                )}
              </div>
            </div>
          </div>

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

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Pour exercer vos droits RGPD (accès, portabilité, suppression des données), rendez-vous dans l'onglet{' '}
              <button
                type="button"
                onClick={() => setTab('donnees')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, padding: 0, fontSize: 13 }}
              >
                Données & RGPD →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Données & RGPD ── */}
      {tab === 'donnees' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Export */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Exporter mes données</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
              Conformément au RGPD (Article 20 — droit à la portabilité), vous pouvez télécharger
              l'ensemble de vos données personnelles dans un fichier JSON : informations de compte,
              profil, préférences, publications et messages.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExport}
              disabled={exportLoading}
              style={{ alignSelf: 'flex-start' }}
            >
              {exportLoading ? 'Préparation…' : '⬇ Télécharger mes données'}
            </button>
          </div>

          {/* Supprimer le compte */}
          <div
            className="card"
            style={{
              border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(239,68,68,0.02))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger, #ef4444)', margin: 0 }}>
                Supprimer mon compte
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
              Conformément au RGPD (Article 17 — droit à l'effacement), vous pouvez demander la
              suppression immédiate de votre compte. Cette action est <strong>irréversible</strong> :
              votre email, profil, préférences et données personnelles seront effacés. Vos
              publications seront anonymisées (auteur affiché comme «&nbsp;[Compte supprimé]&nbsp;»).
            </p>

            {deleteStep === 'idle' && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteStep('confirm')}
                style={{ borderColor: 'rgba(239,68,68,0.4)', color: 'var(--danger, #ef4444)' }}
              >
                Supprimer mon compte
              </button>
            )}

            {deleteStep === 'confirm' && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(239,68,68,0.08)',
                    borderRadius: 10,
                    fontSize: 13,
                    color: 'var(--text)',
                    lineHeight: 1.6,
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  Pour confirmer, tapez <strong>SUPPRIMER</strong> dans le champ ci-dessous.
                </div>
                <input
                  className="form-input"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="SUPPRIMER"
                  autoComplete="off"
                  style={{ borderColor: deleteConfirm === 'SUPPRIMER' ? 'var(--danger, #ef4444)' : undefined }}
                />
                {deleteError && <div className="error-text">{deleteError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setDeleteStep('idle'); setDeleteConfirm(''); setDeleteError(null); }}
                    disabled={deleteLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirm !== 'SUPPRIMER'}
                    style={{
                      background: deleteConfirm === 'SUPPRIMER' ? 'var(--danger, #ef4444)' : 'var(--surface-3)',
                      color: deleteConfirm === 'SUPPRIMER' ? '#fff' : 'var(--text-dim)',
                      borderColor: 'transparent',
                    }}
                  >
                    {deleteLoading ? 'Suppression…' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 16, lineHeight: 1.6 }}>
              Si vous avez des questions, contactez-nous à{' '}
              <span style={{ color: 'var(--primary)' }}>privacy@velentra.fr</span> avant de supprimer votre compte.
            </p>
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
