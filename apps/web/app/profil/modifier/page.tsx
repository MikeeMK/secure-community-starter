'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { Avatar } from '../../components/Avatar';
import { TrustBadge } from '../../components/Badge';
import { ExpandableBio } from '../../components/ExpandableBio';
import {
  LOOKING_FOR_BASE,
  normalizeLookingForValues,
  PROFILE_BIO_MAX_LENGTH,
} from '../../lib/profile';

type ProfileData = {
  age?: number | null;
  city?: string | null;
  gender?: string | null;
  orientation?: string | null;
  relationshipStatus?: string | null;
  lookingFor?: string[];
  interactionType?: string[];
  ageMin?: number | null;
  ageMax?: number | null;
  interests?: string[];
  bio?: string | null;
};

const TABS = ['Identité', 'Préférences', 'Intérêts', 'Bio'] as const;
type Tab = (typeof TABS)[number];

const GENDER_OPTIONS = ['Homme', 'Femme', 'Non-binaire', 'Autre'];
const ORIENTATION_OPTIONS = ['Hétérosexuel·le', 'Homosexuel·le', 'Bisexuel·le', 'Pansexuel·le', 'Asexuel·le', 'Autre'];
const RELATIONSHIP_OPTIONS = ['Célibataire', 'En couple', 'Marié·e', 'Relation libre', 'Autre'];
const LOOKING_FOR_ADULT = ['Plan cul', 'Échangisme', 'Voyeurisme', 'Exhibitionnisme'];
const INTERACTION_BASE = ['Chat', 'Vidéo', 'IRL', 'Groupe'];
const INTERACTION_ADULT = ['Cam', 'Sextos'];
const INTEREST_SUGGESTIONS_BASE = [
  'Roleplay', 'Polyamorie', 'Liberté sexuelle', 'Tantra', 'Massage', 'Lingerie',
  'Jeux de séduction', 'Soirées privées', 'Speed dating',
  'Cinéma', 'Musique', 'Sport', 'Voyage', 'Cuisine', 'Lecture',
];
const INTEREST_SUGGESTIONS_ADULT = ['BDSM', 'Fetish', 'Naturisme'];

const COVER_PALETTES = [
  ['#4F8F8B', '#2E5F5C'],
  ['#7c3aed', '#5b21b6'],
  ['#E85D75', '#c2185b'],
  ['#059669', '#047857'],
  ['#d97706', '#b45309'],
  ['#2563eb', '#1d4ed8'],
  ['#db2777', '#9d174d'],
  ['#0891b2', '#0e7490'],
];

function getCoverGradient(name: string) {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % COVER_PALETTES.length;
  const [a, b] = COVER_PALETTES[idx];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

function MultiSelect({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          style={{
            padding: '8px 16px', borderRadius: 99, fontSize: 14, cursor: 'pointer',
            border: value.includes(opt) ? '2px solid var(--primary)' : '2px solid var(--border)',
            background: value.includes(opt) ? 'var(--primary-glow)' : 'var(--surface-2)',
            color: value.includes(opt) ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: value.includes(opt) ? 700 : 400,
            transition: 'all 0.15s',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 14, cursor: 'pointer',
            border: value === opt ? '2px solid var(--primary)' : '2px solid var(--border)',
            background: value === opt ? 'var(--primary-glow)' : 'var(--surface-2)',
            color: value === opt ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: value === opt ? 700 : 400,
            transition: 'all 0.15s',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function AdultLockedBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderRadius: 'var(--radius-sm)', border: '1.5px dashed var(--border)',
      background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 14,
    }}>
      <span style={{ fontSize: 22 }}>🔒</span>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>Contenu adulte verrouillé</div>
        <div style={{ lineHeight: 1.5 }}>
          Ces options sont accessibles après vérification de votre âge.{' '}
          <a href="/compte" style={{ color: 'var(--primary)', fontWeight: 600 }}>Vérifier mon âge →</a>
        </div>
      </div>
    </div>
  );
}

/* ── Preview component ── */
function ProfilePreview({ profile, displayName, trustLevel }: {
  profile: ProfileData;
  displayName: string;
  trustLevel: string;
}) {
  const coverGradient = getCoverGradient(displayName);
  const hasAnyInfo = profile.gender || profile.orientation || profile.relationshipStatus
    || (profile.lookingFor && profile.lookingFor.length > 0)
    || (profile.interactionType && profile.interactionType.length > 0)
    || (profile.interests && profile.interests.length > 0)
    || profile.bio || profile.city || profile.age;

  return (
    <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--shadow)' }}>
      {/* Cover */}
      <div style={{ background: coverGradient, height: 120, position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
        }} />
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(0,0,0,0.35)', borderRadius: 'var(--radius-sm)',
          padding: '5px 12px', fontSize: 11, color: '#fff', fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
          letterSpacing: '0.03em',
        }}>
          Aperçu public
        </div>
      </div>

      <div style={{ padding: '0 28px 32px', position: 'relative', zIndex: 1 }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}>
          <div style={{ marginTop: -52, border: '5px solid var(--surface)', borderRadius: '50%', background: 'var(--surface)', flexShrink: 0, boxShadow: 'var(--shadow)' }}>
            <Avatar name={displayName} size="xl" />
          </div>
          <div style={{ paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>{displayName}</span>
              <TrustBadge level={trustLevel as 'new' | 'member' | 'moderator' | 'super_admin'} />
            </div>
            {(profile.city || profile.age) && (
              <div style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {profile.city && <span>📍 {profile.city}</span>}
                {profile.age && <><span style={{ color: 'var(--border-light)' }}>·</span><span>🎂 {profile.age} ans</span></>}
              </div>
            )}
          </div>
        </div>

        {!hasAnyInfo && (
          <div style={{
            textAlign: 'center', padding: '24px 0 8px',
            color: 'var(--text-dim)', fontSize: 14, fontStyle: 'italic',
          }}>
            Complétez votre profil pour voir l'aperçu ici.
          </div>
        )}

        {/* Bio */}
        {profile.bio ? (
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <ExpandableBio
              text={profile.bio}
              style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)' }}
            />
          </div>
        ) : hasAnyInfo ? (
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>Aucune bio renseignée.</p>
          </div>
        ) : null}

        {/* Chips identité */}
        {(profile.gender || profile.orientation || profile.relationshipStatus) && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Identité</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.gender && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Genre</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{profile.gender}</span>
                </span>
              )}
              {profile.orientation && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Orient.</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{profile.orientation}</span>
                </span>
              )}
              {profile.relationshipStatus && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Situation</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{profile.relationshipStatus}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Recherche */}
        {(profile.lookingFor && profile.lookingFor.length > 0) && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Je recherche</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {profile.lookingFor.map((v) => (
                <span key={v} style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--primary-glow)', border: '1px solid var(--primary-glow-strong)', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{v}</span>
              ))}
            </div>
          </div>
        )}

        {/* Interactions */}
        {(profile.interactionType && profile.interactionType.length > 0) && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Interactions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {profile.interactionType.map((v) => (
                <span key={v} style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--primary-glow)', border: '1px solid var(--primary-glow-strong)', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{v}</span>
              ))}
            </div>
          </div>
        )}

        {/* Intérêts */}
        {(profile.interests && profile.interests.length > 0) && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Intérêts</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {profile.interests.slice(0, 10).map((v) => (
                <span key={v} style={{ padding: '6px 13px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{v}</span>
              ))}
              {profile.interests.length > 10 && (
                <span style={{ padding: '6px 13px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-dim)' }}>+{profile.interests.length - 10}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfileEditPage() {
  const { utilisateur, estAuthentifie } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('Identité');
  const [form, setForm] = useState<ProfileData>({ lookingFor: [], interactionType: [], interests: [] });
  const [savedProfile, setSavedProfile] = useState<ProfileData>({ lookingFor: [], interactionType: [], interests: [] });
  const [interestInput, setInterestInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fetchDone, setFetchDone] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!estAuthentifie) { router.push('/connexion'); return; }
    apiFetch<{ profile: ProfileData | null }>('/profile/me')
      .then((res) => {
        if (res.profile) {
          const p: ProfileData = {
            age: res.profile.age ?? undefined,
            city: res.profile.city ?? undefined,
            gender: res.profile.gender ?? undefined,
            orientation: res.profile.orientation ?? undefined,
            relationshipStatus: res.profile.relationshipStatus ?? undefined,
            lookingFor: normalizeLookingForValues(res.profile.lookingFor),
            interactionType: res.profile.interactionType ?? [],
            ageMin: res.profile.ageMin ?? undefined,
            ageMax: res.profile.ageMax ?? undefined,
            interests: res.profile.interests ?? [],
            bio: res.profile.bio ?? undefined,
          };
          setForm(p);
          setSavedProfile(p);
        }
        setFetchDone(true);
      })
      .catch(() => setFetchDone(true));
  }, [estAuthentifie, router]);

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addInterest(val: string) {
    const trimmed = val.trim();
    if (!trimmed || (form.interests ?? []).includes(trimmed)) return;
    set('interests', [...(form.interests ?? []), trimmed]);
    setInterestInput('');
  }

  function removeInterest(val: string) {
    set('interests', (form.interests ?? []).filter((i) => i !== val));
  }

  async function handleSave() {
    const currentBio = form.bio ?? '';
    const savedBioValue = savedProfile.bio ?? '';
    const bioWasEdited = currentBio !== savedBioValue;

    if (bioWasEdited && currentBio.length > PROFILE_BIO_MAX_LENGTH) {
      setSaveError(`La biographie ne peut pas dépasser ${PROFILE_BIO_MAX_LENGTH} caractères.`);
      return;
    }

    setLoading(true);
    setSaved(false);
    setSaveError(null);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (form.age) payload.age = Number(form.age);
      if (form.ageMin) payload.ageMin = Number(form.ageMin);
      if (form.ageMax) payload.ageMax = Number(form.ageMax);
      await apiFetch('/profile/me', { method: 'PATCH', body: JSON.stringify(payload) });
      setSaved(true);
      setSavedProfile({ ...form });
      setTimeout(() => setSaved(false), 3000);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  if (!utilisateur || !fetchDone) return <div className="loading-text">Chargement…</div>;

  const isAdultVerified = utilisateur.isAdultVerified ?? false;
  const lookingForOptions = isAdultVerified ? [...LOOKING_FOR_BASE, ...LOOKING_FOR_ADULT] : [...LOOKING_FOR_BASE];
  const interactionOptions = isAdultVerified ? [...INTERACTION_BASE, ...INTERACTION_ADULT] : INTERACTION_BASE;
  const interestSuggestions = isAdultVerified ? [...INTEREST_SUGGESTIONS_BASE, ...INTEREST_SUGGESTIONS_ADULT] : INTEREST_SUGGESTIONS_BASE;
  const savedBioLength = (savedProfile.bio ?? '').length;
  const currentBioLength = (form.bio ?? '').length;
  const hasLegacyBioOverLimit = savedBioLength > PROFILE_BIO_MAX_LENGTH;
  const bioTooLong = currentBioLength > PROFILE_BIO_MAX_LENGTH && (form.bio ?? '') !== (savedProfile.bio ?? '');

  return (
    <div style={{ maxWidth: showPreview ? '100%' : 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>Mon profil</h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>
          Plus votre profil est complet, plus vous serez visible des autres membres.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
        gap: 28,
        alignItems: 'start',
      }}>
        {/* ── FORMULAIRE ── */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 20px', fontSize: 15,
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                  background: 'none', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -2, cursor: 'pointer', transition: 'color 0.15s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab: Identité */}
          {activeTab === 'Identité' && (
            <div className="stack">
              <div className="form-group">
                <label className="form-label">Âge</label>
                <input
                  className="form-input"
                  type="number" min={18} max={99}
                  placeholder="Votre âge"
                  value={form.age ?? ''}
                  onChange={(e) => set('age', e.target.value ? Number(e.target.value) : undefined)}
                  style={{ maxWidth: 180 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ville / Région</label>
                <input
                  className="form-input"
                  type="text" placeholder="Ex : Paris, Lyon…"
                  value={form.city ?? ''}
                  onChange={(e) => set('city', e.target.value || undefined)}
                  style={{ maxWidth: 360 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Genre</label>
                <RadioGroup options={GENDER_OPTIONS} value={form.gender ?? ''} onChange={(v) => set('gender', v)} />
              </div>
              <div className="form-group">
                <label className="form-label">Orientation sexuelle</label>
                <RadioGroup options={ORIENTATION_OPTIONS} value={form.orientation ?? ''} onChange={(v) => set('orientation', v)} />
              </div>
              <div className="form-group">
                <label className="form-label">Situation relationnelle</label>
                <RadioGroup options={RELATIONSHIP_OPTIONS} value={form.relationshipStatus ?? ''} onChange={(v) => set('relationshipStatus', v)} />
              </div>
            </div>
          )}

          {/* Tab: Préférences */}
          {activeTab === 'Préférences' && (
            <div className="stack">
              <div className="form-group">
                <label className="form-label">Je recherche</label>
                <MultiSelect options={lookingForOptions} value={form.lookingFor ?? []} onChange={(v) => set('lookingFor', v)} />
                {!isAdultVerified && <AdultLockedBanner />}
              </div>
              <div className="form-group">
                <label className="form-label">Type d&apos;interaction</label>
                <MultiSelect options={interactionOptions} value={form.interactionType ?? []} onChange={(v) => set('interactionType', v)} />
                {!isAdultVerified && <AdultLockedBanner />}
              </div>
              <div className="form-group">
                <label className="form-label">Tranche d&apos;âge recherchée</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    className="form-input"
                    type="number" min={18} max={99} placeholder="Min"
                    value={form.ageMin ?? ''}
                    onChange={(e) => set('ageMin', e.target.value ? Number(e.target.value) : undefined)}
                    style={{ maxWidth: 110 }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>à</span>
                  <input
                    className="form-input"
                    type="number" min={18} max={99} placeholder="Max"
                    value={form.ageMax ?? ''}
                    onChange={(e) => set('ageMax', e.target.value ? Number(e.target.value) : undefined)}
                    style={{ maxWidth: 110 }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>ans</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Intérêts */}
          {activeTab === 'Intérêts' && (
            <div className="stack">
              <div className="form-group">
                <label className="form-label">Suggestions</label>
                <MultiSelect options={interestSuggestions} value={form.interests ?? []} onChange={(v) => set('interests', v)} />
                {!isAdultVerified && <AdultLockedBanner />}
              </div>
              <div className="form-group">
                <label className="form-label">Ajouter un intérêt personnalisé</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="form-input"
                    type="text" placeholder="Ex : Photographie, Yoga…"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest(interestInput); } }}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => addInterest(interestInput)}>
                    Ajouter
                  </button>
                </div>
              </div>
              {(form.interests ?? []).length > 0 && (
                <div className="form-group">
                  <label className="form-label">Mes intérêts ({(form.interests ?? []).length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(form.interests ?? []).map((i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--primary-glow)', color: 'var(--primary)',
                        fontSize: 14, fontWeight: 600, border: '1px solid var(--primary-glow-strong)',
                      }}>
                        {i}
                        <button
                          type="button"
                          onClick={() => removeInterest(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', lineHeight: 1, padding: 0, fontSize: 15 }}
                        >×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Bio */}
          {activeTab === 'Bio' && (
            <div className="stack">
              <div className="form-group">
                <label className="form-label">Présentation</label>
                <textarea
                  className="form-input"
                  rows={8}
                  placeholder="Décrivez-vous en quelques mots — qui vous êtes, ce qui vous anime, ce que vous cherchez…"
                  value={form.bio ?? ''}
                  onChange={(e) => set('bio', e.target.value || undefined)}
                  maxLength={hasLegacyBioOverLimit ? undefined : PROFILE_BIO_MAX_LENGTH}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ fontSize: 13, color: bioTooLong ? 'var(--danger)' : 'var(--text-dim)', marginTop: 4 }}>
                  {currentBioLength} / {PROFILE_BIO_MAX_LENGTH} caractères
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  3 lignes sont affichées par défaut sur le profil public, avec un bouton "Lire plus" si nécessaire.
                </div>
                {hasLegacyBioOverLimit && (
                  <div style={{ fontSize: 13, color: bioTooLong ? 'var(--danger)' : 'var(--warning)', lineHeight: 1.5 }}>
                    Votre bio actuelle dépasse l'ancienne limite autorisée. Vous pouvez la conserver telle quelle, mais il faudra la raccourcir à {PROFILE_BIO_MAX_LENGTH} caractères maximum pour la modifier.
                  </div>
                )}
                {bioTooLong && (
                  <div className="form-error">
                    La biographie doit être raccourcie avant l'enregistrement.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--border)',
          }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/dashboard')}
            >
              Retour au dashboard
            </button>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', borderRadius: 'var(--radius-sm)',
                border: showPreview ? '2px solid var(--primary)' : '2px solid var(--border)',
                background: showPreview ? 'var(--primary-glow)' : 'var(--surface-2)',
                color: showPreview ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{showPreview ? '👁' : '👁'}</span>
              {showPreview ? 'Masquer l\'aperçu' : 'Prévisualiser'}
            </button>
          {saved && (
            <span style={{ fontSize: 14, color: 'var(--success, #22c55e)', fontWeight: 600 }}>
              ✅ Profil mis à jour !{showPreview ? ' L\'aperçu a été actualisé.' : ''}
            </span>
          )}
        </div>
        {saveError && <div className="error-text" style={{ marginTop: 12 }}>{saveError}</div>}

        {showPreview && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 10 }}>
              L'aperçu se met à jour après chaque enregistrement.
            </p>
          )}
        </div>

        {/* ── PRÉVISUALISATION ── */}
        {showPreview && (
          <div style={{ position: 'sticky', top: 'calc(var(--nav-height, 88px) + 24px)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👁</span>
              Ce que voient les autres
            </div>
            <ProfilePreview
              profile={savedProfile}
              displayName={utilisateur.displayName}
              trustLevel={utilisateur.trustLevel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
