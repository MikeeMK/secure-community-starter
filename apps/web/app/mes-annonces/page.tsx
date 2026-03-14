'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RichTextarea } from '../components/RichTextarea';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { toPlainTextPreview } from '../lib/markdown';

type Annonce = {
  id: string;
  title: string;
  body: string;
  category: string;
  region?: string | null;
  createdAt: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Amitié: '#3b82f6',
  Activités: '#10b981',
  'Rencontre adulte': '#ef4444',
  Autre: '#8b5cf6',
};

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

export default function MesAnnoncesPage() {
  const { utilisateur, estAuthentifie, authResolved } = useAuth();
  const router = useRouter();
  const [annonces, setAnnonces] = React.useState<Annonce[] | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [editionId, setEditionId] = React.useState<string | null>(null);
  const [titreEdit, setTitreEdit] = React.useState('');
  const [corpsEdit, setCorpsEdit] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!authResolved) return;
    if (!estAuthentifie) {
      router.push('/connexion');
      return;
    }
    apiFetch<Annonce[]>('/community/forum/topics/my-announcements')
      .then((list) => setAnnonces(list))
      .catch(() => { setAnnonces([]); setErreur('Impossible de charger vos annonces.'); });
  }, [authResolved, estAuthentifie, router]);

  if (!authResolved || !utilisateur) return <div className="loading-text">Chargement…</div>;

  async function supprimerAnnonce(id: string) {
    if (!confirm('Supprimer cette annonce ?')) return;
    try {
      await apiFetch(`/community/forum/topics/${id}`, { method: 'DELETE' });
      setAnnonces((prev) => prev?.filter((a) => a.id !== id) ?? []);
      if (editionId === id) setEditionId(null);
    } catch (e) {
      setErreur(String(e));
    }
  }

  function commencerEdition(annonce: Annonce) {
    setEditionId(annonce.id);
    setTitreEdit(annonce.title);
    setCorpsEdit(annonce.body);
    setErreur(null);
  }

  async function sauvegarderEdition() {
    if (!editionId) return;
    setLoading(true);
    try {
      const maj = await apiFetch<Annonce>(`/community/forum/topics/${editionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: titreEdit, body: corpsEdit }),
      });
      setAnnonces((prev) => prev?.map((a) => (a.id === editionId ? { ...a, title: maj.title, body: maj.body } : a)) ?? null);
      setEditionId(null);
    } catch (e) {
      setErreur(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>Mes annonces</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Gérez vos annonces. Les mises à jour peuvent prendre jusqu'à 30 minutes avant d'apparaître publiquement.
        </p>
      </div>

      {erreur && <div className="error-text" style={{ marginBottom: 12 }}>{erreur}</div>}

      {annonces === null && <p className="loading-text">Chargement de vos annonces…</p>}

      {annonces && annonces.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📭</span>
          <p>Vous n'avez pas encore publié d'annonce.</p>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Publier depuis le dashboard</Link>
        </div>
      )}

      {annonces && annonces.length > 0 && (
        <div className="stack" style={{ gap: 14 }}>
          {annonces.map((annonce) => {
            const enEdition = editionId === annonce.id;
            return (
              <div key={annonce.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <CategoryPill category={annonce.category} />
                      {annonce.region && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {annonce.region}</span>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(annonce.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {enEdition ? (
                      <div className="stack" style={{ gap: 10 }}>
                        <input
                          className="form-input"
                          value={titreEdit}
                          onChange={(e) => setTitreEdit(e.target.value)}
                          required
                          maxLength={120}
                        />
                        <RichTextarea
                          value={corpsEdit}
                          onChange={setCorpsEdit}
                          rows={5}
                          placeholder="Modifiez le contenu de votre annonce…"
                        />
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" className="btn btn-primary btn-sm" onClick={sauvegarderEdition} disabled={loading}>
                            {loading ? 'Enregistrement…' : 'Enregistrer'}
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditionId(null)} disabled={loading}>
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>{annonce.title}</h3>
                        <p style={{
                          margin: 0,
                          color: 'var(--text)',
                          fontSize: 14,
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {toPlainTextPreview(annonce.body)}
                        </p>
                        <Link href={`/annonces/${annonce.id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                          Lire plus →
                        </Link>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    {!enEdition && (
                      <>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => commencerEdition(annonce)}>
                          Modifier
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => supprimerAnnonce(annonce.id)} style={{ color: 'var(--danger, #c0392b)' }}>
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
