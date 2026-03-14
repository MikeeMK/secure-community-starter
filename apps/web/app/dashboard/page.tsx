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

export default function DashboardPage() {
  const { utilisateur, estAuthentifie, authResolved } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [emailVerified, setEmailVerified] = React.useState(false);
  const [tokenBalance, setTokenBalance] = React.useState<number | undefined>(undefined);
  const [modAlerts, setModAlerts] = React.useState(0);
  const [showAnnouncementForm, setShowAnnouncementForm] = React.useState(false);
  const [announcementTitle, setAnnouncementTitle] = React.useState('');
  const [announcementBody, setAnnouncementBody] = React.useState('');
  const [announcementCategory, setAnnouncementCategory] = React.useState<(typeof ANNOUNCEMENT_CATEGORIES)[number]>('Autre');
  const [announcementRegion, setAnnouncementRegion] = React.useState('');
  const [announcementDept, setAnnouncementDept] = React.useState('');
  const [announcementPhotos, setAnnouncementPhotos] = React.useState<File[]>([]);
  const [announcementStep, setAnnouncementStep] = React.useState<'infos' | 'photos'>('infos');
  const [announcementLoading, setAnnouncementLoading] = React.useState(false);
  const [announcementPosted, setAnnouncementPosted] = React.useState<Topic | null>(null);
  const [announcementError, setAnnouncementError] = React.useState<string | null>(null);

  const deptOptions = React.useMemo(() => {
    if (!announcementRegion) return [];
    return FRANCE_LOCATIONS.filter((l) => l.type === 'department' && l.region === announcementRegion);
  }, [announcementRegion]);

  const effectiveRegion = announcementDept || announcementRegion;

  React.useEffect(() => {
    if (!authResolved) return;
    if (!estAuthentifie) {
      router.push('/connexion');
      return;
    }

    const fetchProfile = () => {
      setProfileLoaded(false);
      apiFetch<{ profile: UserProfile | null; emailVerifiedAt?: string | null }>('/profile/me')
        .then((res) => {
          setProfile(res.profile ?? null);
          setEmailVerified(!!res.emailVerifiedAt);
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
    setAnnouncementLoading(true);
    setAnnouncementError(null);
    try {
      let uploaded: string[] = [];
      if (announcementPhotos.length) {
        const formData = new FormData();
        announcementPhotos.forEach((file, idx) => formData.append(`file${idx}`, file));
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
      setAnnouncementStep('infos');
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
            displayName={utilisateur.displayName}
            email={utilisateur.email}
            trustLevel={utilisateur.trustLevel}
            profile={profile}
            emailVerified={emailVerified}
            tokenBalance={tokenBalance}
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
              onClick={() => setShowAnnouncementForm((v) => !v)}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Catégorie</div>
                  <select
                    className="form-input"
                    value={announcementCategory}
                    onChange={(e) => setAnnouncementCategory(e.target.value as (typeof ANNOUNCEMENT_CATEGORIES)[number])}
                  >
                    {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} disabled={cat === 'Rencontre adulte' && !utilisateur.isAdultVerified}>
                        {cat === 'Rencontre adulte' && !utilisateur.isAdultVerified ? '🔒 Rencontre adulte (profil adulte requis)' : cat}
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
                    <option value="">Toutes les régions</option>
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
                      <option value="">Tous les départements</option>
                      {deptOptions.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {announcementStep === 'infos' && (
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
                    placeholder="Décrivez ce que vous recherchez, vos envies, vos attentes…"
                    rows={4}
                  />
                </>
              )}

              {announcementStep === 'photos' && (
                <PhotoUploader photos={announcementPhotos} onChange={setAnnouncementPhotos} />
              )}
              {announcementError && (
                <div style={{ fontSize: 13, color: 'var(--danger, #ef4444)', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '10px 14px', fontWeight: 500 }}>
                  {announcementError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {announcementStep === 'infos' ? (
                  <>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={announcementLoading}>
                      {announcementLoading ? 'Publication…' : 'Publier l\'annonce'}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAnnouncementStep('photos')}>
                      Étape 2 : Photos (optionnel)
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAnnouncementStep('infos')}>
                      Retour aux infos
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
