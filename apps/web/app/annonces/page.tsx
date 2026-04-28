'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '../components/Avatar';
import { TrustBadge, PlanPill } from '../components/Badge';
import { UserProfileTrigger } from '../components/UserProfileTrigger';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FRANCE_LOCATIONS, REGIONS } from '../lib/regions';
import { toPlainTextPreview } from '../lib/markdown';

type Annonce = {
  id: string;
  title: string;
  body: string;
  category: string;
  region?: string | null;
  photos?: string[] | null;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string; plan?: string };
  _count: { likes: number };
  isFavorited?: boolean;
};

const CATEGORIES = [
  'Toutes',
  'Rencontre Hétéro',
  'Rencontre Gay',
  'Rencontre Lesbienne',
  'Rencontre Bi',
  'Rencontre Couple',
  'Amitié',
  'Activités & Sorties',
  'Vente',
  'Services',
  'Location',
  'Autre',
] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, string> = {
  'Rencontre Hétéro':  '#e11d48',
  'Rencontre Gay':     '#7c3aed',
  'Rencontre Lesbienne': '#db2777',
  'Rencontre Bi':      '#9333ea',
  'Rencontre Couple':  '#dc2626',
  'Amitié':            '#3b82f6',
  'Activités & Sorties': '#10b981',
  'Vente':             '#f59e0b',
  'Services':          '#0891b2',
  'Location':          '#059669',
  'Autre':             '#8b5cf6',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function CategoryPill({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? '#8b5cf6';
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: 99,
      fontSize: 12, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}40`,
    }}>
      {category}
    </span>
  );
}

export default function AnnoncesPage() {
  const { utilisateur } = useAuth();
  const [annonces, setAnnonces] = React.useState<Annonce[] | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilter>('Toutes');
  const [search, setSearch] = React.useState('');
  const [selectedRegion, setSelectedRegion] = React.useState('');
  const [selectedDept, setSelectedDept] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  const isLoggedIn = !!utilisateur;

  // Departments for selected region
  const deptOptions = React.useMemo(() => {
    if (!selectedRegion) return [];
    return FRANCE_LOCATIONS.filter((l) => l.type === 'department' && l.region === selectedRegion);
  }, [selectedRegion]);

  // Effective region filter = dept if selected, else region
  const effectiveRegion = selectedDept || selectedRegion;

  // Whether any filter is active (triggers search)
  const hasFilter = activeCategory !== 'Toutes' || effectiveRegion !== '' || debouncedSearch.trim() !== '';

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    if (!hasFilter) return; // Don't load until user applies a filter
    setHasSearched(true);
    const params = new URLSearchParams();
    if (activeCategory !== 'Toutes') params.set('category', activeCategory);
    if (effectiveRegion) params.set('region', effectiveRegion);
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    const url = `/community/forum/annonces${params.toString() ? `?${params}` : ''}`;
    apiFetch<Annonce[]>(url).then(setAnnonces).catch(() => setAnnonces([]));
  }, [activeCategory, effectiveRegion, debouncedSearch, hasFilter]);

  async function toggleFavorite(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return;
    const res = await apiFetch<{ favorited: boolean }>(`/community/forum/topics/${id}/favorite`, { method: 'POST' }).catch(() => null);
    if (!res) return;
    setAnnonces((prev) => prev?.map((a) => a.id === id ? { ...a, isFavorited: res.favorited } : a) ?? null);
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Annonces</h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>
          Les membres partagent leurs envies et recherches — contactez-les directement.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        gap: 12,
        marginBottom: 24,
        alignItems: 'end',
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, color: 'var(--text-dim)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            className="form-input"
            type="text"
            placeholder="Rechercher une annonce…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 42, height: 46, fontSize: 15 }}
          />
        </div>

        {/* Category */}
        <select
          className="form-input"
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value as CategoryFilter)}
          style={{ height: 46, fontSize: 15, minWidth: 180 }}
        >
          <option value="Toutes">Toutes les catégories</option>
          <optgroup label="Rencontres">
            <option value="Rencontre Hétéro">Rencontre Hétéro</option>
            <option value="Rencontre Gay">Rencontre Gay</option>
            <option value="Rencontre Lesbienne">Rencontre Lesbienne</option>
            <option value="Rencontre Bi">Rencontre Bi</option>
            <option value="Rencontre Couple">Rencontre Couple</option>
          </optgroup>
          <optgroup label="Social">
            <option value="Amitié">Amitié</option>
            <option value="Activités & Sorties">Activités &amp; Sorties</option>
          </optgroup>
          <optgroup label="Classifiés">
            <option value="Vente">Vente</option>
            <option value="Services">Services</option>
            <option value="Location">Location</option>
            <option value="Autre">Autre</option>
          </optgroup>
        </select>

        {/* Region */}
        <select
          className="form-input"
          value={selectedRegion}
          onChange={(e) => { setSelectedRegion(e.target.value); setSelectedDept(''); }}
          style={{ height: 46, fontSize: 15, minWidth: 200 }}
        >
          <option value="">Toutes les régions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Department — only shown once a region is selected */}
        {selectedRegion && (
          <select
            className="form-input"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ height: 46, fontSize: 15, minWidth: 220 }}
          >
            <option value="">Tous les départements</option>
            {deptOptions.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Active filters summary */}
      {(selectedRegion || activeCategory !== 'Toutes' || debouncedSearch) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Filtres actifs :</span>
          {activeCategory !== 'Toutes' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--surface-2)', fontSize: 13, fontWeight: 600 }}>
              {activeCategory}
              <button type="button" onClick={() => setActiveCategory('Toutes')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-dim)', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          )}
          {selectedRegion && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--surface-2)', fontSize: 13, fontWeight: 600 }}>
              📍 {selectedDept || selectedRegion}
              <button type="button" onClick={() => { setSelectedRegion(''); setSelectedDept(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-dim)', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          )}
          {debouncedSearch && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--surface-2)', fontSize: 13, fontWeight: 600 }}>
              "{debouncedSearch}"
              <button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-dim)', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          )}
        </div>
      )}

      {/* Invitation à chercher (état initial) */}
      {!hasSearched && (
        <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Recherchez une annonce</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Choisissez une catégorie, une région ou tapez un mot-clé pour afficher les annonces correspondantes.
          </p>
        </div>
      )}

      {hasSearched && !annonces && <p className="loading-text" style={{ fontSize: 16 }}>Chargement…</p>}

      {hasSearched && annonces && annonces.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📢</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 16 }}>Aucune annonce pour ces critères.</p>
          <Link href="/dashboard" className="btn btn-primary">Publier une annonce</Link>
        </div>
      )}

      {hasSearched && annonces && annonces.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {annonces.map((a) => (
            <Link key={a.id} href={`/annonces/${a.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                cursor: 'pointer',
                borderLeft: `4px solid ${CATEGORY_COLORS[a.category] ?? '#8b5cf6'}`,
                transition: 'box-shadow 0.15s, transform 0.1s',
                padding: '18px 18px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 16, alignItems: 'stretch' }}>
                  <div style={{
                    width: '100%',
                    height: 170,
                    position: 'relative',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border)',
                  }}>
                    {a.photos?.[0] ? (
                      <Image
                        src={a.photos[0]}
                        alt={a.title}
                        fill
                        unoptimized
                        sizes="180px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pas de photo</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 2 }}>
                      <Avatar name={a.author.displayName} size="sm" />
                      <UserProfileTrigger
                        userId={a.author.id}
                        displayName={a.author.displayName}
                        stopPropagation
                        style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}
                      >
                        <span>{a.author.displayName}</span>
                      </UserProfileTrigger>
                      <TrustBadge level={a.author.trustLevel} />
                      <PlanPill plan={a.author.plan} />
                      <CategoryPill category={a.category} />
                      {a.region && (
                        <span style={{ fontSize: 12, color: 'var(--text-dim)', background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 99, fontWeight: 600 }}>
                          📍 {a.region}
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>{timeAgo(a.createdAt)}</span>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.3, color: 'var(--text)' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                        {a.title}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                      margin: 0, wordBreak: 'break-word',
                    }}>
                      {toPlainTextPreview(a.body)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, paddingLeft: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--text-dim)', fontWeight: 600 }}>
                      <span style={{ fontSize: 16 }}>♥</span>
                      <span>{a._count.likes}</span>
                    </div>
                    {isLoggedIn && (
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, a.id)}
                        title={a.isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 22, lineHeight: 1, padding: 2,
                          color: a.isFavorited ? '#f59e0b' : 'var(--text-dim)',
                          transition: 'color 0.15s, transform 0.1s',
                        }}
                      >
                        {a.isFavorited ? '★' : '☆'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
