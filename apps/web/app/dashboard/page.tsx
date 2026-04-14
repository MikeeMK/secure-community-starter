'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { ProfileCard } from './components/ProfileCard';
import { NotificationsPanel } from './components/NotificationsPanel';
import { CommunityActivityCard } from './components/CommunityActivityCard';
import { SuggestedMembersCard } from './components/SuggestedMembersCard';
import { PlanWidget } from './components/PlanWidget';
import { MesAnnoncesCard } from './components/MesAnnoncesCard';
import { RichTextarea } from '../components/RichTextarea';
import { FRANCE_LOCATIONS, REGIONS } from '../lib/regions';
import { PhotoUploader } from './components/PhotoUploader';

type UserProfile = {
  age?: number | null;
  city?: string | null;
  bio?: string | null;
  interests?: string[];
  gender?: string | null;
  orientation?: string | null;
  lookingFor?: string[];
};

type ProfileMeResponse = {
  profile: UserProfile | null;
  emailVerifiedAt?: string | null;
  completion?: number;
  completionUnlocked?: boolean;
};

type Topic = { id: string; title: string; createdAt: string };

const navItems = [
  { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
  { icon: '🔍', label: 'Recherche', href: '/annonces' },
  { icon: '💬', label: 'Messagerie', href: '/messagerie' },
  { icon: '👥', label: 'Membres', href: '/membres' },
  { icon: '⭐', label: 'Annonces favorites', href: '/annonces/favoris' },
  { icon: '📢', label: 'Mes annonces', href: '/mes-annonces' },
  { icon: '⚙️', label: 'Paramètres', href: '/compte' },
];

const ANNOUNCEMENT_CATEGORIES = ['Amitié', 'Activités', 'Rencontre adulte', 'Autre'] as const;
const ANNOUNCEMENT_STEPS = ['cadre', 'contenu', 'photos'] as const;

export default function DashboardPage() {
  const { utilisateur, estAuthentifie, authResolved } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [emailVerified, setEmailVerified] = React.useState(false);
  const [profileCompletion, setProfileCompletion] = React.useState<number | undefined>(undefined);
  const [profileCompletionUnlocked, setProfileCompletionUnlocked] = React.useState(false);
  const [tokenBalance, setTokenBalance] = React.useState<number | undefined>(undefined);
  const [modAlerts, setModAlerts] = React.useState(0);
  const [showAnnouncementForm, setShowAnnouncementForm] = React.useState(false);
  const [announcementTitle, setAnnouncementTitle] = React.useState('');
  const [announcementBody, setAnnouncementBody] = React.useState('');
  const [announcementCategory, setAnnouncementCategory] = React.useState<(typeof ANNOUNCEMENT_CATEGORIES)[number]>('Autre');
  const [announcementRegion, setAnnouncementRegion] = React.useState('');
  const [announcementDept, setAnnouncementDept] = React.useState('');
  const [announcementPhotos, setAnnouncementPhotos] = React.useState<File[]>([]);
  const [announcementPrimaryIndex, setAnnouncementPrimaryIndex] = React.useState(0);
  const [announcementStep, setAnnouncementStep] = React.useState<(typeof ANNOUNCEMENT_STEPS)[number]>('cadre');
  const [announcementLoading, setAnnouncementLoading] = React.useState(false);
  const [announcementPosted, setAnnouncementPosted] = React.useState<Topic | null>(null);
  const [announcementError, setAnnouncementError] = React.useState<string | null>(null);

  const deptOptions = React.useMemo(() => {
    if (!announcementRegion) return [];
    return FRANCE_LOCATIONS.filter((l) => l.type === 'department' && l.region === announcementRegion);
  }, [announcementRegion]);

  const effectiveRegion = announcementDept || announcementRegion;
  const canAdvanceCadre = !!announcementCategory && !!effectiveRegion;
  const canAdvanceContenu = announcementTitle.trim().length >= 3 && announcementBody.trim().length >= 10;

  React.useEffect(() => {
    if (!authResolved) return;
    if (!estAuthentifie) {
      router.push('/connexion');
      return;
    }

    const fetchProfile = () => {
      setProfileLoaded(false);
      apiFetch<ProfileMeResponse>('/profile/me')
        .then((res) => {
          setProfile(res.profile ?? null);
          setEmailVerified(!!res.emailVerifiedAt);
          setProfileCompletion(res.completion);
          setProfileCompletionUnlocked(!!res.completionUnlocked);
          setProfileLoaded(true);
        })
        .catch(() => setProfileLoaded(true));
    };

    fetchProfile();

    apiFetch<{ balance: number }>('/tokens/balance')
      .then((res) => setTokenBalance(res.balance))
      .catch(() => {});

    const onFocus = () => fetchProfile();
    window.addEventListener('focus', onFocus);

    // Poll mod alerts if staff
    const isStaff = utilisateur?.trustLevel === 'moderator' || utilisateur?.trustLevel === 'super_admin';
    let interval: NodeJS.Timeout | undefined;
    if (isStaff) {
      const fetchAlerts = () =>
        apiFetch<{ openReports: number; recentFeedbacks: number }>('/moderation/alerts')
          .then((a) => setModAlerts(a.openReports + a.recentFeedbacks))
          .catch(() => {});
      fetchAlerts();
      interval = setInterval(fetchAlerts, 30000);
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      if (interval) clearInterval(interval);
    };
  }, [authResolved, estAuthentifie, router, utilisateur?.trustLevel]);

  async function handleAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (announcementStep !== 'photos') return;
    if (!canAdvanceCadre) {
      setAnnouncementError('Choisissez une catégorie et une zone avant de continuer.');
      setAnnouncementStep('cadre');
      return;
    }
    if (!canAdvanceContenu) {
      setAnnouncementError('Ajoutez un titre valide et une description un peu plus complète avant de publier.');
      setAnnouncementStep('contenu');
      return;
    }
    setAnnouncementLoading(true);
    setAnnouncementError(null);
    try {
      const orderedPhotos = announcementPhotos.length
        ? announcementPhotos.map((photo, index) => ({
            photo,
            sortIndex: index === announcementPrimaryIndex ? -1 : index,
          })).sort((a, b) => a.sortIndex - b.sortIndex).map((entry) => entry.photo)
        : [];
      let uploaded: string[] = [];
      if (orderedPhotos.length) {
        const formData = new FormData();
        orderedPhotos.forEach((file) => formData.append('files', file));
        const res = await fetch('/api/uploads', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload photos échoué');
        const json = await res.json();
        uploaded = json.urls ?? [];
      }
      const topic = await apiFetch<Topic>('/community/forum/topics', {
        method: 'POST',
        body: JSON.stringify({
          title: announcementTitle,
          body: announcementBody,
          isAnnouncement: true,
          category: announcementCategory,
          region: effectiveRegion || undefined,
          photos: uploaded.length ? uploaded : undefined,
        }),
      });
      setAnnouncementPosted(topic);
      setShowAnnouncementForm(false);
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setAnnouncementDept('');
      setAnnouncementRegion('');
      setAnnouncementPhotos([]);
      setAnnouncementPrimaryIndex(0);
      setAnnouncementStep('cadre');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setAnnouncementError(msg ?? 'Une erreur est survenue.');
    } finally {
      setAnnouncementLoading(false);
    }
  }

  if (!authResolved || !utilisateur) {
    return <div className="loading-text">Chargement…</div>;
  }

  return (
    <div className="dashboard-layout">
      {/* ── Colonne gauche : navigation ───────────────────────────── */}
      <aside className="dashboard-left">
        <nav className="dashboard-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`dashboard-nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="dashboard-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {(utilisateur.trustLevel === 'moderator' || utilisateur.trustLevel === 'super_admin') && (
            <>
              <div className="dashboard-nav-divider" />
              <Link href="/admin/moderation" className={`dashboard-nav-item ${pathname.startsWith('/admin') ? 'active' : ''}`} style={{ position: 'relative' }}>
                <span className="dashboard-nav-icon">🛡️</span>
                Modération
                {modAlerts > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 99,
                    minWidth: 18,
                    height: 18,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                  }}>
                    {modAlerts > 99 ? '99+' : modAlerts}
                  </span>
                )}
              </Link>
            </>
          )}

          <div className="dashboard-nav-divider" />
          <button
            className="dashboard-nav-item"
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-feedback'))}
          >
            <span className="dashboard-nav-icon">💡</span>
            Donnez votre avis
          </button>
        </nav>
      </aside>

      {/* ── Colonne centre : contenu principal ────────────────────── */}
      <main className="dashboard-center">
        {/* Profil */}
        {profileLoaded ? (
          <ProfileCard
            userId={utilisateur.id}
            displayName={utilisateur.displayName}
            email={utilisateur.email}
            profile={profile}
            emailVerified={emailVerified}
            tokenBalance={tokenBalance}
            completion={profileCompletion}
            completionUnlocked={profileCompletionUnlocked}
          />
        ) : (
          <div className="card" style={{ padding: 16 }}>
            <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '40%', height: 12, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '80%', height: 10 }} />
          </div>
        )}

        {/* Annonce CTA */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: showAnnouncementForm ? 16 : 0 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📢 Publier une annonce</div>
              {!showAnnouncementForm && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Décrivez ce que vous recherchez — les membres intéressés pourront vous contacter.
                </p>
              )}
            </div>
            <button
              className={`btn btn-sm ${showAnnouncementForm ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => {
                setShowAnnouncementForm((v) => !v);
                if (!showAnnouncementForm) {
                  setAnnouncementError(null);
                  setAnnouncementPosted(null);
                }
              }}
              style={{ flexShrink: 0, marginLeft: 12 }}
            >
              {showAnnouncementForm ? 'Annuler' : 'Publier'}
            </button>
          </div>

          {announcementPosted && !showAnnouncementForm && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--primary-glow)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
              ✅ Annonce publiée !{' '}
              <Link href={`/annonces/${announcementPosted.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Voir l'annonce →
              </Link>
            </div>
          )}

          {showAnnouncementForm && (
            <form onSubmit={handleAnnouncement} className="stack">
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  {[
                    {
                      id: 'cadre',
                      label: '1. Cadre',
                      desc: 'Catégorie et zone',
                      active: announcementStep === 'cadre',
                      done: canAdvanceCadre || announcementStep !== 'cadre',
                    },
                    {
                      id: 'contenu',
                      label: '2. Contenu',
                      desc: 'Titre et description',
                      active: announcementStep === 'contenu',
                      done: canAdvanceContenu || announcementStep === 'photos',
                    },
                    {
                      id: 'photos',
                      label: '3. Photos',
                      desc: 'Photo principale et aperçu',
                      active: announcementStep === 'photos',
                      done: false,
                    },
                  ].map((step) => (
                    <div
                      key={step.id}
                      style={{
                        borderRadius: 16,
                        padding: 14,
                        border: step.active ? '1px solid rgba(107, 244, 218, 0.32)' : '1px solid var(--border)',
                        background: step.active ? 'rgba(107, 244, 218, 0.08)' : 'var(--surface-2)',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: step.active ? 'var(--primary)' : 'var(--text)' }}>
                        {step.label}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{step.desc}</div>
                      {step.done && (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>
                          Prêt
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {announcementStep === 'cadre' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Catégorie</div>
                      <select
                        className="form-input"
                        value={announcementCategory}
                        onChange={(e) => setAnnouncementCategory(e.target.value as (typeof ANNOUNCEMENT_CATEGORIES)[number])}
                      >
                        {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Région</div>
                      <select
                        className="form-input"
                        value={announcementRegion}
                        onChange={(e) => { setAnnouncementRegion(e.target.value); setAnnouncementDept(''); }}
                      >
                        <option value="">Choisir une région</option>
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    {announcementRegion && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Département</div>
                        <select
                          className="form-input"
                          value={announcementDept}
                          onChange={(e) => setAnnouncementDept(e.target.value)}
                        >
                          <option value="">Rester sur toute la région</option>
                          {deptOptions.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="card card-sm" style={{ gridColumn: '1 / -1', background: 'var(--surface-2)' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Zone de diffusion</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        Votre annonce sera rattachée à <strong style={{ color: 'var(--text)' }}>{effectiveRegion || 'aucune zone choisie'}</strong>. Choisir une région ou un département rend la recherche plus pertinente pour les autres membres.
                      </div>
                    </div>
                  </div>
                )}

                {announcementStep === 'contenu' && (
                  <>
                    <input
                      className="form-input"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Titre de votre annonce"
                      required minLength={3} maxLength={120}
                    />
                    <RichTextarea
                      value={announcementBody}
                      onChange={setAnnouncementBody}
                      placeholder="Décrivez clairement ce que vous recherchez, l’ambiance voulue, vos attentes, et ce que les autres membres doivent savoir."
                      rows={6}
                    />
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      Plus votre description est claire, plus l’annonce sera compréhensible et crédible.
                    </div>
                  </>
                )}

                {announcementStep === 'photos' && (
                  <>
                    <PhotoUploader
                      photos={announcementPhotos}
                      primaryIndex={announcementPrimaryIndex}
                      onChange={setAnnouncementPhotos}
                      onPrimaryChange={setAnnouncementPrimaryIndex}
                    />
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      La photo marquée <strong>Principale</strong> sera affichée en premier dans la liste des annonces et en tête de la fiche détaillée.
                    </div>
                  </>
                )}
              </div>

              {announcementError && (
                <div style={{ fontSize: 13, color: 'var(--danger, #ef4444)', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '10px 14px', fontWeight: 500 }}>
                  {announcementError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {announcementStep === 'cadre' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!canAdvanceCadre}
                      onClick={() => {
                        if (!canAdvanceCadre) {
                          setAnnouncementError('Choisissez une catégorie et une région avant de continuer.');
                          return;
                        }
                        setAnnouncementError(null);
                        setAnnouncementStep('contenu');
                      }}
                    >
                      Étape 2 : Contenu
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAnnouncementForm(false)}>
                      Fermer
                    </button>
                  </>
                )}

                {announcementStep === 'contenu' && (
                  <>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAnnouncementStep('cadre')}>
                      Retour au cadre
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!canAdvanceContenu}
                      onClick={() => {
                        if (!canAdvanceContenu) {
                          setAnnouncementError('Ajoutez un titre et une description plus complète avant de continuer.');
                          return;
                        }
                        setAnnouncementError(null);
                        setAnnouncementStep('photos');
                      }}
                    >
                      Étape 3 : Photos
                    </button>
                  </>
                )}

                {announcementStep === 'photos' && (
                  <>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAnnouncementStep('contenu')}>
                      Retour au contenu
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={announcementLoading}>
                      {announcementLoading ? 'Publication…' : 'Publier l\'annonce'}
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Mes annonces */}
        <MesAnnoncesCard />

        {/* Activité communauté */}
        <CommunityActivityCard />
      </main>

      {/* ── Colonne droite : widgets ──────────────────────────────── */}
      <aside className="dashboard-right">
        <NotificationsPanel />
        <SuggestedMembersCard hasProfile={!!profile} />
        <PlanWidget trustLevel={utilisateur.trustLevel} />
        <div className="card" style={{ padding: '12px 16px' }}>
          <Link href="/changelog" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>
            <span>📰</span>
            <span>Nouveautés</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
