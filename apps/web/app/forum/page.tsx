'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '../components/Avatar';
import { TrustBadge } from '../components/Badge';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Sujet = {
  id: string;
  title: string;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string };
  group: { id: string; name: string } | null;
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function PageForum() {
  const [sujets, setSujets] = React.useState<Sujet[] | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [afficherFormulaire, setAfficherFormulaire] = React.useState(false);

  React.useEffect(() => {
    apiFetch<Sujet[]>('/community/forum/topics')
      .then(setSujets)
      .catch((e) => setErreur(String(e)));
  }, []);

  return (
    <div>
      <div className="page-header row-between">
        <div>
          <h1 className="page-title">Forum</h1>
          <p className="page-subtitle">Parcourez et participez aux discussions de la communauté</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAfficherFormulaire(!afficherFormulaire)}>
          {afficherFormulaire ? 'Annuler' : '+ Nouveau sujet'}
        </button>
      </div>

      {afficherFormulaire && (
        <FormulaireNouveauSujet
          onCree={(s) => { setSujets((prev) => prev ? [s, ...prev] : [s]); setAfficherFormulaire(false); }}
        />
      )}

      <div className="card" style={{ padding: '8px 20px' }}>
        {erreur && <div className="error-text" style={{ margin: '12px 0' }}>{erreur}</div>}

        {!sujets && !erreur && (
          <p className="loading-text">Chargement des sujets&hellip;</p>
        )}

        {sujets && sujets.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">&#x1F4AC;</span>
            <p>Aucun sujet pour l&apos;instant. Soyez le premier à lancer une discussion.</p>
          </div>
        )}

        {sujets && sujets.map((sujet) => (
          <Link key={sujet.id} href={`/forum/${sujet.id}`} style={{ display: 'block', textDecoration: 'none' }}>
            <div className="topic-item">
              <Avatar name={sujet.author.displayName} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="topic-title">{sujet.title}</div>
                <div className="topic-meta">
                  <Link
                    href={`/profil/${sujet.author.id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'var(--text-muted)', fontWeight: 500 }}
                  >
                    {sujet.author.displayName}
                  </Link>
                  <TrustBadge level={sujet.author.trustLevel as 'new' | 'normal' | 'trusted' | 'restricted'} />
                  <span className="topic-separator">·</span>
                  <span>{formaterDate(sujet.createdAt)}</span>
                  {sujet.group && (
                    <>
                      <span className="topic-separator">·</span>
                      <span className="tag tag-primary">{sujet.group.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
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
          <textarea
            className="form-textarea"
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            required rows={5}
            placeholder="Rédigez votre message&hellip;"
          />
        </div>
        {erreur && <div className="error-text">{erreur}</div>}
        <div>
          <button type="submit" className="btn btn-primary" disabled={chargement}>
            {chargement ? 'Publication&hellip;' : 'Publier le sujet'}
          </button>
        </div>
      </form>
    </div>
  );
}
