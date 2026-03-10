'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '../../components/Badge';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type FeedbackItem = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; displayName: string };
  aiAnalysis: {
    sentiment?: string;
    category?: string;
    tags?: string[];
    summary?: string;
  } | null;
};

type Signalement = {
  id: string;
  status: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
  reporter: { id: string; displayName: string };
};

type UserItem = {
  id: string;
  displayName: string;
  email: string;
  trustLevel: string;
  createdAt: string;
  lastActiveAt: string | null;
  _count: { forumTopics: number; forumPosts: number };
};

const labelStatut: Record<string, string> = {
  ALL: 'Tous',
  OPEN: 'Ouvert',
  IN_REVIEW: 'En examen',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
};

const labelCible: Record<string, string> = {
  USER: 'Utilisateur',
  TOPIC: 'Sujet',
  POST: 'Message',
  MESSAGE: 'MP',
};

const labelGrade: Record<string, string> = {
  new: 'Nouveau',
  member: 'Membre',
  moderator: 'Modérateur',
  super_admin: 'Super Admin',
};

const colorGrade: Record<string, string> = {
  new: 'var(--text-muted)',
  member: 'var(--text-base)',
  moderator: 'var(--warning)',
  super_admin: 'var(--danger)',
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Jamais';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

// ── Signalements tab ──────────────────────────────────────────────────────────

function OngletSignalements() {
  const [signalements, setSignalements] = React.useState<Signalement[] | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [filtre, setFiltre] = React.useState<string>('ALL');

  React.useEffect(() => {
    apiFetch<Signalement[]>('/moderation/reports')
      .then(setSignalements)
      .catch((e) => setErreur(String(e)));
  }, []);

  const statuts = ['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'];
  const filtres = signalements
    ? filtre === 'ALL' ? signalements : signalements.filter((r) => r.status === filtre)
    : null;
  const compteurs = signalements
    ? statuts.slice(1).reduce((acc, s) => {
        acc[s] = signalements.filter((r) => r.status === s).length;
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <>
      {signalements && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 28 }}>
          <div className="card card-sm stat-card">
            <div className="stat-number" style={{ fontSize: 26 }}>{signalements.length}</div>
            <div className="stat-label">Total signalements</div>
          </div>
          <div className="card card-sm stat-card">
            <div className="stat-number" style={{ fontSize: 26, color: 'var(--danger)' }}>{compteurs['OPEN'] ?? 0}</div>
            <div className="stat-label">Ouverts</div>
          </div>
          <div className="card card-sm stat-card">
            <div className="stat-number" style={{ fontSize: 26, color: 'var(--warning)' }}>{compteurs['IN_REVIEW'] ?? 0}</div>
            <div className="stat-label">En examen</div>
          </div>
          <div className="card card-sm stat-card">
            <div className="stat-number" style={{ fontSize: 26, color: 'var(--success)' }}>{compteurs['RESOLVED'] ?? 0}</div>
            <div className="stat-label">Résolus</div>
          </div>
        </div>
      )}

      <div className="row" style={{ gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {statuts.map((s) => (
          <button key={s} onClick={() => setFiltre(s)} className={`btn btn-sm ${filtre === s ? 'btn-primary' : 'btn-secondary'}`}>
            {labelStatut[s] ?? s}
            {s !== 'ALL' && signalements && (
              <span style={{ marginLeft: 6, background: filtre === s ? 'rgba(0,0,0,0.2)' : 'var(--surface-3)', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                {compteurs[s] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {erreur && <div className="error-text" style={{ marginBottom: 20 }}>{erreur}</div>}
      {!signalements && !erreur && <p className="loading-text">Chargement des signalements&hellip;</p>}

      {filtres && filtres.length === 0 && (
        <div className="card empty-state">
          <span className="empty-state-icon">&#x2705;</span>
          <p>Aucun signalement correspondant à ce filtre.</p>
        </div>
      )}

      {filtres && filtres.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Signaleur</th>
                <th>Cible</th>
                <th>Motif</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((signalement) => (
                <tr key={signalement.id}>
                  <td><span style={{ fontWeight: 600, fontSize: 14 }}>{signalement.reporter.displayName}</span></td>
                  <td>
                    <span className="tag">{labelCible[signalement.targetType] ?? signalement.targetType}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3, fontFamily: 'monospace' }}>
                      {signalement.targetId.slice(0, 12)}&hellip;
                    </div>
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {signalement.reason.length > 80 ? signalement.reason.slice(0, 80) + '\u2026' : signalement.reason}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formaterDate(signalement.createdAt)}</td>
                  <td><StatusBadge status={signalement.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function OngletUtilisateurs() {
  const [users, setUsers] = React.useState<UserItem[] | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<{ id: string } | null>(null);

  function refresh() {
    apiFetch<UserItem[]>('/users').then(setUsers).catch((e) => setErreur(String(e)));
  }

  React.useEffect(() => { refresh(); }, []);

  async function changeRole(id: string, trustLevel: string) {
    setLoading(id + trustLevel);
    try {
      await apiFetch(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ trustLevel }) });
      refresh();
    } catch (e) {
      setErreur(String(e));
    } finally {
      setLoading(null);
    }
  }

  async function supprimerUser(id: string) {
    setLoading(id + 'delete');
    setConfirm(null);
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      refresh();
    } catch (e) {
      setErreur(String(e));
    } finally {
      setLoading(null);
    }
  }

  if (erreur) return <div className="error-text">{erreur}</div>;
  if (!users) return <p className="loading-text">Chargement des utilisateurs&hellip;</p>;

  return (
    <>
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 380, width: '100%', padding: 28, textAlign: 'center' }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Supprimer cet utilisateur ?</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Cette action est irréversible. Tous ses posts et sujets seront supprimés.
            </p>
            <div className="row" style={{ gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(null)}>Annuler</button>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--danger)', color: '#fff' }}
                onClick={() => supprimerUser(confirm.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}>
        {users.length} membre{users.length !== 1 ? 's' : ''}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Membre</th>
              <th>Grade</th>
              <th>Activité</th>
              <th>Inscrit le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{u.email}</div>
                </td>
                <td>
                  <span style={{ fontWeight: 600, fontSize: 13, color: colorGrade[u.trustLevel] ?? 'inherit' }}>
                    {labelGrade[u.trustLevel] ?? u.trustLevel}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <div>{u._count.forumTopics} sujet{u._count.forumTopics !== 1 ? 's' : ''}</div>
                  <div>{u._count.forumPosts} post{u._count.forumPosts !== 1 ? 's' : ''}</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>{timeAgo(u.lastActiveAt)}</div>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formaterDate(u.createdAt)}
                </td>
                <td>
                  {u.trustLevel !== 'super_admin' ? (
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <select
                        value={u.trustLevel}
                        disabled={!!loading}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        style={{
                          fontSize: 12,
                          padding: '3px 6px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: 'var(--surface-2)',
                          color: 'var(--text-base)',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="new">Nouveau</option>
                        <option value="member">Membre</option>
                        <option value="moderator">Modérateur</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--danger)', color: '#fff', fontSize: 12 }}
                        disabled={!!loading}
                        onClick={() => setConfirm({ id: u.id })}
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Propriétaire</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Feedbacks tab ─────────────────────────────────────────────────────────────

const sentimentConfig: Record<string, { label: string; color: string; bg: string }> = {
  positive:   { label: '😊 Positif',   color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  neutral:    { label: '😐 Neutre',    color: 'var(--text-muted)', bg: 'var(--surface-3)' },
  frustrated: { label: '😤 Frustré',   color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  angry:      { label: '😡 Irrité',    color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
};

function parseFeedbackContent(raw: string): { category: string | null; body: string } {
  const match = raw.match(/^\[(Suggestion|Bug|Question)\]\s*/i);
  if (match) return { category: match[1], body: raw.slice(match[0].length) };
  return { category: null, body: raw };
}

function OngletFeedbacks() {
  const [feedbacks, setFeedbacks] = React.useState<FeedbackItem[] | null>(null);
  const [filtreSentiment, setFiltreSentiment] = React.useState<string>('ALL');
  const [filtreCateg, setFiltreCateg] = React.useState<string>('ALL');
  const [expanded, setExpanded] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<FeedbackItem[]>('/feedback').then(setFeedbacks).catch(() => setFeedbacks([]));
  }, []);

  if (!feedbacks) return <p className="loading-text">Chargement des feedbacks…</p>;

  const sentiments = ['ALL', 'positive', 'neutral', 'frustrated', 'angry'];
  const categories = ['ALL', 'Suggestion', 'Bug', 'Question'];

  const filtered = feedbacks.filter((f) => {
    const s = (f.aiAnalysis?.sentiment ?? 'neutral');
    const { category } = parseFeedbackContent(f.content);
    if (filtreSentiment !== 'ALL' && s !== filtreSentiment) return false;
    if (filtreCateg !== 'ALL' && (category ?? 'Autre') !== filtreCateg) return false;
    return true;
  });

  const counts = sentiments.slice(1).reduce((acc, s) => {
    acc[s] = feedbacks.filter((f) => (f.aiAnalysis?.sentiment ?? 'neutral') === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card card-sm stat-card">
          <div className="stat-number" style={{ fontSize: 26 }}>{feedbacks.length}</div>
          <div className="stat-label">Total</div>
        </div>
        {sentiments.slice(1).map((s) => {
          const cfg = sentimentConfig[s];
          return (
            <div key={s} className="card card-sm stat-card">
              <div className="stat-number" style={{ fontSize: 26, color: cfg.color }}>{counts[s] ?? 0}</div>
              <div className="stat-label">{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {sentiments.map((s) => (
            <button key={s} onClick={() => setFiltreSentiment(s)} className={`btn btn-sm ${filtreSentiment === s ? 'btn-primary' : 'btn-secondary'}`}>
              {s === 'ALL' ? 'Tout' : sentimentConfig[s]?.label ?? s}
              {s !== 'ALL' && <span style={{ marginLeft: 5, opacity: 0.7 }}>{counts[s]}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <button key={c} onClick={() => setFiltreCateg(c)} className={`btn btn-sm ${filtreCateg === c ? 'btn-primary' : 'btn-ghost'}`}>
              {c === 'ALL' ? 'Toutes catégories' : c === 'Suggestion' ? '💡 ' + c : c === 'Bug' ? '🐛 ' + c : '❓ ' + c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card empty-state"><span className="empty-state-icon">✅</span><p>Aucun feedback.</p></div>
      )}

      <div className="stack" style={{ gap: 10 }}>
        {filtered.map((f) => {
          const { category, body } = parseFeedbackContent(f.content);
          const sentiment = f.aiAnalysis?.sentiment ?? 'neutral';
          const cfg = sentimentConfig[sentiment] ?? sentimentConfig.neutral;
          const isOpen = expanded === f.id;
          return (
            <div key={f.id} className="card" style={{ padding: '14px 18px', borderLeft: `3px solid ${cfg.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Meta row */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{f.user.displayName}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formaterDate(f.createdAt)}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, fontWeight: 700 }}>
                      {cfg.label}
                    </span>
                    {category && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-3)', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {category === 'Suggestion' ? '💡' : category === 'Bug' ? '🐛' : '❓'} {category}
                      </span>
                    )}
                    {f.aiAnalysis?.category && f.aiAnalysis.category !== 'other' && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(124,58,237,0.08)', color: '#7c3aed', fontWeight: 600 }}>
                        IA: {f.aiAnalysis.category}
                      </span>
                    )}
                  </div>
                  {/* Content */}
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {isOpen ? body : body.length > 160 ? body.slice(0, 160) + '…' : body}
                  </p>
                  {/* AI summary + tags */}
                  {isOpen && f.aiAnalysis && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12 }}>
                      {f.aiAnalysis.summary && (
                        <div style={{ marginBottom: 6, color: 'var(--text-muted)' }}>
                          <strong>Résumé IA :</strong> {f.aiAnalysis.summary}
                        </div>
                      )}
                      {f.aiAnalysis.tags && f.aiAnalysis.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {f.aiAnalysis.tags.map((tag) => (
                            <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {body.length > 160 && (
                  <button
                    onClick={() => setExpanded(isOpen ? null : f.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 12, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    {isOpen ? 'Réduire ↑' : 'Voir tout ↓'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PageModeration() {
  const { utilisateur } = useAuth();
  const [onglet, setOnglet] = React.useState<'signalements' | 'utilisateurs' | 'news' | 'feedbacks' | 'faq'>('signalements');
  const isSuperAdmin = utilisateur?.trustLevel === 'super_admin';

  return (
    <div>
      <div className="page-header row-between">
        <div>
          <h1 className="page-title">Modération</h1>
          <p className="page-subtitle">Administrez la communauté</p>
        </div>
        <span className="badge badge-restricted" style={{ fontSize: 12, padding: '5px 12px' }}>
          {isSuperAdmin ? 'Super Admin' : 'Modérateur'}
        </span>
      </div>

      {/* Onglets */}
      <div className="row" style={{ gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setOnglet('signalements')}
          className={`btn btn-sm ${onglet === 'signalements' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: '6px 6px 0 0' }}
        >
          Signalements
        </button>
        {isSuperAdmin && (
          <>
            <button
              onClick={() => setOnglet('feedbacks')}
              className={`btn btn-sm ${onglet === 'feedbacks' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '6px 6px 0 0' }}
            >
              Feedbacks
            </button>
            <button
              onClick={() => setOnglet('utilisateurs')}
              className={`btn btn-sm ${onglet === 'utilisateurs' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '6px 6px 0 0' }}
            >
              Utilisateurs
            </button>
            <button
              onClick={() => setOnglet('news')}
              className={`btn btn-sm ${onglet === 'news' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '6px 6px 0 0' }}
            >
              News
            </button>
            <button
              onClick={() => setOnglet('faq')}
              className={`btn btn-sm ${onglet === 'faq' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '6px 6px 0 0' }}
            >
              FAQ
            </button>
          </>
        )}
      </div>

      {onglet === 'signalements' && <OngletSignalements />}
      {onglet === 'feedbacks' && isSuperAdmin && <OngletFeedbacks />}
      {onglet === 'utilisateurs' && isSuperAdmin && <OngletUtilisateurs />}
      {onglet === 'news' && isSuperAdmin && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Gérez les news et reliez-les aux feedbacks utilisateurs.
          </p>
          <Link href="/admin/news" className="btn btn-primary btn-sm">
            Ouvrir l'éditeur de news
          </Link>
        </div>
      )}
      {onglet === 'faq' && isSuperAdmin && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Gérez les questions et réponses affichées sur la page FAQ publique.
          </p>
          <Link href="/admin/faq" className="btn btn-primary btn-sm">
            Ouvrir la gestion FAQ
          </Link>
        </div>
      )}
    </div>
  );
}
