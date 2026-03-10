'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '../components/Avatar';
import { TrustBadge } from '../components/Badge';
import { UserProfileTrigger } from '../components/UserProfileTrigger';
import { PlanPill } from '../components/Badge';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { RichTextarea } from '../components/RichTextarea';

type Sujet = {
  id: string;
  title: string;
  category?: string | null;
  closed?: boolean;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string };
  group: { id: string; name: string } | null;
};

type UserLite = { id: string; displayName: string; trustLevel?: string | null; lastActiveAt?: string | null };

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function PageForum() {
  const { utilisateur } = useAuth();
  const router = useRouter();
  const [sujets, setSujets] = React.useState<Sujet[] | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [afficherFormulaire, setAfficherFormulaire] = React.useState(false);
  const [recherche, setRecherche] = React.useState('');
  const categories = ['Toutes', 'Amitié', 'Activités', 'Rencontre adulte', 'Autre'] as const;
  const [categorieActive, setCategorieActive] = React.useState<(typeof categories)[number]>('Toutes');
  const SUBCATEGORIES: Record<string, string[]> = {
    'Rencontre adulte': ['Discussions générales', 'Fétichisme des pieds', 'Fessées', 'BDSM léger', 'Soft', 'Autre'],
  };
  const [sousCategorie, setSousCategorie] = React.useState<string>('Toutes');
  const [menuOuvert, setMenuOuvert] = React.useState<string | null>(null);
  const [actionsRecentes, setActionsRecentes] = React.useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = React.useState<UserLite[]>([]);
  const [offlineUsers, setOfflineUsers] = React.useState<UserLite[]>([]);
  const estStaff = utilisateur ? ['moderator', 'super_admin'].includes(utilisateur.trustLevel) : false;

  const renderBadges = (trust?: string | null) => {
    if (!trust) return null;
    const isStaff = trust === 'moderator' || trust === 'super_admin';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {isStaff && <TrustBadge level={trust} />}
        {!isStaff && <PlanPill plan={trust} />}
      </span>
    );
  };

  React.useEffect(() => {
    apiFetch<Sujet[]>('/community/forum/topics')
      .then(setSujets)
      .catch((e) => setErreur(String(e)));

    apiFetch<{ onlineUsers: UserLite[]; offlineUsers: UserLite[] }>('/community/sidebar')
      .then((data) => {
        setOnlineUsers(data.onlineUsers.slice(0, 5));
        setOfflineUsers(data.offlineUsers.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const sujetsFiltres = React.useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return (sujets ?? [])
      .filter((s) => {
        const cat = s.category ?? 'Autre';
        return categorieActive === 'Toutes' || cat === categorieActive;
      })
      .filter((s) => {
        if (categorieActive !== 'Rencontre adulte') return true;
        if (sousCategorie === 'Toutes') return true;
        const title = s.title.toLowerCase();
        return title.includes(sousCategorie.toLowerCase());
      })
      .filter((s) => (terme ? s.title.toLowerCase().includes(terme) : true));
  }, [sujets, categorieActive, recherche, sousCategorie]);

  function logAction(message: string) {
    setActionsRecentes((prev) => [`${new Date().toLocaleTimeString('fr-FR')} · ${message}`, ...prev].slice(0, 10));
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 24, alignItems: 'start' }}>
      <aside className="card" style={{ padding: 16, height: 'fit-content' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Catégories</h3>
        <div className="stack" style={{ gap: 8 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-ghost btn-sm ${cat === categorieActive ? 'btn-active' : ''}`}
              style={{
                justifyContent: 'flex-start',
                background: cat === categorieActive ? 'var(--primary-glow)' : undefined,
                borderColor: cat === categorieActive ? 'var(--primary)' : undefined,
                color: cat === categorieActive ? 'var(--primary)' : undefined,
                boxShadow: cat === categorieActive ? '0 0 0 1px var(--primary)' : undefined,
              }}
              onClick={() => { setCategorieActive(cat); setSousCategorie('Toutes'); }}
            >
              {cat}
            </button>
          ))}
        </div>
        {categorieActive === 'Rencontre adulte' && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Sous-catégorie</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Toutes', ...SUBCATEGORIES['Rencontre adulte']].map((sub) => (
                <button
                  key={sub}
                  className={`btn btn-ghost btn-xs ${sousCategorie === sub ? 'btn-active' : ''}`}
                  style={{
                    justifyContent: 'flex-start',
                    background: sousCategorie === sub ? 'var(--surface-2)' : undefined,
                    color: sousCategorie === sub ? 'var(--primary)' : 'var(--text)',
                    borderColor: sousCategorie === sub ? 'var(--primary)' : 'var(--border)',
                  }}
                  onClick={() => setSousCategorie(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main>
        <div className="page-header row-between">
          <div>
            <h1 className="page-title">Forum</h1>
            <p className="page-subtitle">Parcourez et participez aux discussions de la communauté</p>
          </div>
          <button className="btn btn-primary" onClick={() => setAfficherFormulaire(!afficherFormulaire)}>
            {afficherFormulaire ? 'Annuler' : '+ Nouveau sujet'}
          </button>
        </div>

        <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
          <input
            className="form-input"
            placeholder="Rechercher un sujet..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>

        {afficherFormulaire && (
          <FormulaireNouveauSujet
            onCree={(s) => { setSujets((prev) => prev ? [s, ...prev] : [s]); setAfficherFormulaire(false); }}
          />
        )}

        <div className="card" style={{ padding: '8px 20px' }}>
          {erreur && <div className="error-text" style={{ margin: '12px 0' }}>{erreur}</div>}

          {!sujets && !erreur && (
            <p className="loading-text">Chargement des sujets…</p>
          )}

          {sujets && sujetsFiltres.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">💬</span>
              <p>Aucun sujet ne correspond à votre recherche.</p>
            </div>
          )}

          {sujets && sujetsFiltres.map((sujet) => {
            const peutGerer = estStaff || utilisateur?.id === sujet.author.id;
            return (
              <Link key={sujet.id} href={`/forum/${sujet.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div className="topic-item" style={{ position: 'relative' }}>
                  <Avatar name={sujet.author.displayName} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="topic-title" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>{sujet.title}</span>
                      {sujet.closed && <span className="tag tag-muted">Fermé</span>}
                    </div>
                    <div className="topic-meta">
                      <UserProfileTrigger
                        userId={sujet.author.id}
                        displayName={sujet.author.displayName}
                        stopPropagation
                        style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        <span>{sujet.author.displayName}</span>
                      </UserProfileTrigger>
                      {renderBadges(sujet.author.trustLevel)}
                      <span className="topic-separator">·</span>
                      <span>{formaterDate(sujet.createdAt)}</span>
                    {sujet.category && (
                        <>
                          <span className="topic-separator">·</span>
                          <span className="tag tag-muted">{sujet.category}</span>
                        </>
                      )}
                      {sujet.group && (
                        <>
                          <span className="topic-separator">·</span>
                          <span className="tag tag-primary">{sujet.group.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {peutGerer && (
                    <div style={{ marginLeft: 8 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOuvert((prev) => prev === sujet.id ? null : sujet.id); }}
                      >
                        ⋮
                      </button>
                      {menuOuvert === sujet.id && (
                        <div className="card" style={{ position: 'absolute', right: 8, top: 40, zIndex: 20, padding: 8, width: 210 }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOuvert(null); router.push(`/forum/${sujet.id}`); }}
                          >
                            Ouvrir
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                            onClick={async (e) => {
                              e.preventDefault(); e.stopPropagation();
                              const nouveauTitre = prompt('Nouveau titre', sujet.title);
                              if (!nouveauTitre || !nouveauTitre.trim()) return;
                              try {
                                const maj = await apiFetch<Sujet>(`/community/forum/topics/${sujet.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ title: nouveauTitre }),
                                });
                                setSujets((prev) => prev?.map((s) => s.id === sujet.id ? { ...s, title: maj.title } : s) ?? null);
                                logAction(`Sujet renommé en "${maj.title}"`);
                              } catch (err) {
                                setErreur(String(err));
                              } finally {
                                setMenuOuvert(null);
                              }
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                            onClick={async (e) => {
                              e.preventDefault(); e.stopPropagation();
                              const nextClosed = !sujet.closed;
                              try {
                                await apiFetch(`/community/forum/topics/${sujet.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ closed: nextClosed }),
                                });
                                setSujets((prev) => prev?.map((s) => s.id === sujet.id ? { ...s, closed: nextClosed } : s) ?? null);
                                logAction(`Sujet "${sujet.title}" ${nextClosed ? 'fermé' : 'réouvert'}`);
                              } catch (err) {
                                setErreur(String(err));
                              } finally {
                                setMenuOuvert(null);
                              }
                            }}
                          >
                            {sujet.closed ? 'Réouvrir' : 'Fermer'}
                          </button>
                          <div style={{ margin: '6px 0' }}>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Déplacer vers :</label>
                            <select
                              className="form-input"
                              value={sujet.category ?? 'Autre'}
                              onChange={async (e) => {
                                e.preventDefault(); e.stopPropagation();
                                const newCat = e.target.value;
                                try {
                                  await apiFetch(`/community/forum/topics/${sujet.id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ category: newCat }),
                                  });
                                  setSujets((prev) => prev?.map((s) => s.id === sujet.id ? { ...s, category: newCat } : s) ?? null);
                                  logAction(`Sujet "${sujet.title}" déplacé vers ${newCat}`);
                                } catch (err) {
                                  setErreur(String(err));
                                }
                              }}
                            >
                              {categories.filter((c) => c !== 'Toutes').map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          {estStaff && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger, #c0392b)' }}
                              onClick={async (e) => {
                                e.preventDefault(); e.stopPropagation();
                                if (!confirm('Supprimer ce sujet ?')) return;
                                try {
                                  await apiFetch(`/community/forum/topics/${sujet.id}`, { method: 'DELETE' });
                                  setSujets((prev) => prev?.filter((s) => s.id !== sujet.id) ?? null);
                                  logAction(`Sujet "${sujet.title}" supprimé`);
                                } catch (err) {
                                  setErreur(String(err));
                                } finally {
                                  setMenuOuvert(null);
                                }
                              }}
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <aside className="card" style={{ padding: 16, height: 'fit-content' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Activité forum</h3>
        {actionsRecentes.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Les actions récentes apparaîtront ici.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actionsRecentes.map((a, idx) => (
              <li key={idx} style={{ fontSize: 12, color: 'var(--text)' }}>{a}</li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>En ligne</div>
          {onlineUsers.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Personne en ligne.</p>}
          {onlineUsers.map((u) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--success, #22c55e)', display: 'inline-block',
              }} />
              <span>{u.displayName}</span>
              {renderBadges(u.trustLevel)}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Hors ligne</div>
          {offlineUsers.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</p>}
          {offlineUsers.map((u) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', display: 'inline-block',
              }} />
              <span>{u.displayName}</span>
              {renderBadges(u.trustLevel)}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function FormulaireNouveauSujet({ onCree }: { onCree: (s: Sujet) => void }) {
  const { utilisateur } = useAuth();
  const [titre, setTitre] = React.useState('');
  const [corps, setCorps] = React.useState('');
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    if (!utilisateur) {
      setErreur('Connexion requise');
      setChargement(false);
      return;
    }
    try {
      const sujet = await apiFetch<Sujet>('/community/forum/topics', {
        method: 'POST',
        body: JSON.stringify({ title: titre, body: corps }),
      });
      onCree(sujet);
      setTitre('');
      setCorps('');
    } catch (e) {
      setErreur(String(e));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="card card-accent" style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 18, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
        Nouveau sujet
      </h3>
      <form onSubmit={handleSubmit} className="stack">
        <div className="form-group">
          <label className="form-label">Titre</label>
          <input
            className="form-input"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required minLength={3} maxLength={120}
            placeholder="Titre du sujet"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Contenu</label>
          <RichTextarea
            value={corps}
            onChange={setCorps}
            placeholder="Rédigez votre message…"
            rows={6}
          />
        </div>
        {erreur && <div className="error-text">{erreur}</div>}
        <div>
          <button type="submit" className="btn btn-primary" disabled={chargement}>
            {chargement ? 'Publication…' : 'Publier le sujet'}
          </button>
        </div>
      </form>
    </div>
  );
}
