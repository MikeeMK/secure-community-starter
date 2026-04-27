'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { TrustBadge } from '../../components/Badge';
import { RichContent } from '../../components/RichContent';
import { UserProfileTrigger } from '../../components/UserProfileTrigger';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type Annonce = {
  id: string;
  title: string;
  body: string;
  isAnnouncement: boolean;
  photos?: string[] | null;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string };
  _count: { likes: number };
  liked: boolean;
  favorited?: boolean;
};

const REPORT_REASONS = [
  'Contenu inapproprié',
  'Spam',
  'Ne respecte pas le règlement',
  'Autre',
] as const;

function formaterDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AnnonceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { utilisateur, estAuthentifie } = useAuth();

  const [annonce, setAnnonce] = React.useState<Annonce | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(0);
  const [favorited, setFavorited] = React.useState(false);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatStarted, setChatStarted] = React.useState(false);
  const [photoIndex, setPhotoIndex] = React.useState<number>(0);
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('Contenu inapproprié');
  const [reportNote, setReportNote] = React.useState('');
  const [reportSent, setReportSent] = React.useState(false);
  const [reporting, setReporting] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return undefined;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [menuOpen]);

  React.useEffect(() => {
    if (!id) return;
    apiFetch<Annonce>(`/community/forum/topics/${id}`)
      .then((a) => {
        setAnnonce(a);
        setLiked(a.liked);
        setLikeCount(a._count.likes);
        setFavorited(a.favorited ?? false);
      })
      .catch((e) => setErreur(String(e)));
  }, [id]);

  async function handleLike() {
    if (!estAuthentifie) return;
    const prev = liked;
    setLiked(!prev);
    setLikeCount((c) => prev ? c - 1 : c + 1);
    try {
      await apiFetch(`/community/forum/topics/${id}/like`, { method: 'POST' });
    } catch {
      setLiked(prev);
      setLikeCount((c) => prev ? c + 1 : c - 1);
    }
  }

  async function handleFavorite() {
    if (!estAuthentifie) return;
    const prev = favorited;
    setFavorited(!prev);
    try {
      await apiFetch(`/community/forum/topics/${id}/favorite`, { method: 'POST' });
    } catch {
      setFavorited(prev);
    }
  }

  async function handleChat() {
    if (!estAuthentifie || !annonce) return;
    setChatLoading(true);
    try {
      const res = await apiFetch<{ conversationId: string }>('/chat/start', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: annonce.author.id, announcementId: id }),
      });
      // Open chat widget with this conversation
      window.dispatchEvent(new CustomEvent('open-chat', { detail: { conversationId: res.conversationId } }));
      setChatStarted(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Impossible d’ouvrir la conversation pour le moment.');
    } finally {
      setChatLoading(false);
    }
  }

  async function handleReport() {
    if (!annonce) return;
    if (reporting) return;
    setReporting(true);
    try {
      await apiFetch('/moderation/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'TOPIC',
          targetId: annonce.id,
          reason: reportReason === 'Autre' ? reportNote || 'Autre' : reportReason,
        }),
      });
      setReportSent(true);
      setMenuOpen(false);
    } catch (e) {
      alert('Signalement impossible pour le moment.');
    } finally {
      setReporting(false);
    }
  }

  if (erreur) return (
    <div style={{ padding: 24 }}>
      <Link href="/annonces" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>&larr; Retour aux annonces</Link>
      <div className="error-text">{erreur}</div>
    </div>
  );
  if (!annonce) return (
    <div style={{ padding: 24 }}>
      <Link href="/annonces" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>&larr; Retour aux annonces</Link>
      <p className="loading-text">Chargement…</p>
    </div>
  );

  const isOwn = utilisateur?.id === annonce.author.id;
  const mainPhoto = annonce.photos?.[photoIndex ?? 0];

  return (
    <>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px' }}>
        <Link href="/annonces" className="btn btn-ghost btn-sm" style={{ marginBottom: 24, display: 'inline-flex' }}>
          &larr; Retour aux annonces
        </Link>

        <div className="card">
          {mainPhoto && (
            <div style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', minHeight: 460 }}>
              <Image
                src={mainPhoto}
                alt={annonce.title}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 900px"
                style={{ objectFit: 'cover', display: 'block' }}
                onClick={() => setLightbox(mainPhoto)}
              />
            </div>
          )}

          {annonce.photos && annonce.photos.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 10, marginBottom: 16 }}>
              {annonce.photos.map((p, idx) => (
                <button
                  key={p + idx}
                  type="button"
                  onClick={() => { setPhotoIndex(idx); setLightbox(p); }}
                  style={{
                    border: idx === photoIndex ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    padding: 0,
                    background: 'var(--surface-2)',
                    cursor: 'pointer',
                    position: 'relative',
                    height: 110,
                  }}
                >
                  <Image
                    src={p}
                    alt={`Photo ${idx + 1}`}
                    fill
                    unoptimized
                    sizes="120px"
                    style={{ objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
            <Link href={`/profil/${annonce.author.id}`}>
              <Avatar name={annonce.author.displayName} size="md" />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                <UserProfileTrigger
                  userId={annonce.author.id}
                  displayName={annonce.author.displayName}
                  style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}
                >
                  <span>{annonce.author.displayName}</span>
                </UserProfileTrigger>
                <TrustBadge level={annonce.author.trustLevel} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formaterDate(annonce.createdAt)}</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.25, letterSpacing: '-0.03em', margin: 0 }}>
                {annonce.title}
              </h1>
            </div>
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Actions"
                aria-expanded={menuOpen}
                style={{
                  minHeight: 38,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '0 14px',
                  borderRadius: 999,
                  fontWeight: 700,
                  boxShadow: menuOpen ? '0 0 0 1px rgba(107, 244, 218, 0.25), 0 12px 28px rgba(0, 0, 0, 0.22)' : undefined,
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>⋯</span>
                <span>Actions</span>
              </button>
              {reportSent && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--primary)' }}>
                  Signalement envoyé, merci.
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <RichContent
            value={annonce.body}
            style={{
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              marginBottom: 24,
            }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className={`reaction-btn ${liked ? 'active' : ''}`}
              onClick={handleLike}
              disabled={!estAuthentifie || isOwn}
            >
              ♥ {likeCount > 0 ? likeCount : 'J\'aime'}
            </button>

            {estAuthentifie && !isOwn && (
              <button
                className={`btn btn-sm ${favorited ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={handleFavorite}
                title={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                style={{ minWidth: 36 }}
              >
                {favorited ? '★ Favori' : '☆ Favoris'}
              </button>
            )}

            {!isOwn && estAuthentifie && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleChat}
                disabled={chatLoading || chatStarted}
              >
                {chatStarted ? 'Message envoyé ✓' : chatLoading ? 'Connexion…' : '💬 Contacter par chat'}
              </button>
            )}

            {isOwn && (
              <Link href={`/annonces/${id}/modifier`} className="btn btn-secondary btn-sm">
                Modifier mon annonce
              </Link>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
          }}
        >
          <Image
            src={lightbox}
            alt="Aperçu"
            width={1600}
            height={1200}
            unoptimized
            sizes="90vw"
            style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
          />
        </div>
      )}

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(7, 11, 18, 0.76)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="card"
            role="dialog"
            aria-modal="true"
            aria-label="Actions sur l'annonce"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(100%, 560px)',
              padding: 18,
              borderRadius: 24,
              boxShadow: '0 32px 90px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Actions
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, color: 'var(--text)' }}>
                  Gérer cette annonce
                </div>
                <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                  Choisissez une action rapide, ou signalez cette annonce si elle ne respecte pas les règles de la communauté.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer"
                style={{ width: 36, height: 36, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}
              >
                ✕
              </button>
            </div>

            {!isOwn && (
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  marginBottom: 18,
                }}
              >
                <Link
                  href={`/profil/${annonce.author.id}`}
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    minWidth: 0,
                    minHeight: 74,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    padding: '16px 18px',
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                    whiteSpace: 'normal',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Voir le profil de l’auteur</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'left', lineHeight: 1.5 }}>
                      Ouvrez directement le profil de ce membre pour voir ses infos et ses autres actions.
                    </span>
                  </span>
                </Link>

                {!isOwn && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setMenuOpen(false);
                    void handleChat();
                  }}
                  disabled={!estAuthentifie || chatLoading}
                  style={{
                    minWidth: 0,
                    minHeight: 74,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    padding: '16px 18px',
                    borderRadius: 18,
                    border: '1px solid rgba(107, 244, 218, 0.2)',
                    background: 'linear-gradient(180deg, rgba(107, 244, 218, 0.12), rgba(107, 244, 218, 0.04))',
                    whiteSpace: 'normal',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>
                      {chatStarted ? 'Conversation ouverte' : 'Envoyer un message'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'normal', lineHeight: 1.5 }}>
                      {estAuthentifie ? 'Contactez directement l’auteur depuis la messagerie.' : 'Connectez-vous pour écrire à l’auteur.'}
                    </span>
                  </span>
                </button>
                )}
              </div>
            )}

            <div
              style={{
                borderRadius: 20,
                padding: 16,
                border: '1px solid rgba(255, 180, 106, 0.2)',
                background: 'linear-gradient(180deg, rgba(255, 180, 106, 0.08), rgba(255, 180, 106, 0.03))',
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                    Signaler cette annonce
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                    Utilisez ce formulaire uniquement si le contenu pose un vrai problème: spam, non-respect des règles, contenu inapproprié, ou autre motif sérieux.
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgb(255, 190, 122)' }}>
                  Modération
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {REPORT_REASONS.map((reason) => {
                  const active = reportReason === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setReportReason(reason)}
                      style={{
                        borderRadius: 999,
                        padding: '10px 14px',
                        border: active ? '1px solid rgba(255, 190, 122, 0.5)' : '1px solid var(--border)',
                        background: active ? 'rgba(255, 190, 122, 0.14)' : 'var(--surface-2)',
                        color: active ? 'rgb(255, 216, 166)' : 'var(--text)',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>

              {reportReason === 'Autre' && (
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Expliquez brièvement le problème constaté."
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  style={{ marginBottom: 12, resize: 'vertical' }}
                />
              )}

              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', minHeight: 46 }}
                onClick={handleReport}
                disabled={reporting || (reportReason === 'Autre' && !reportNote.trim())}
              >
                {reporting ? 'Envoi du signalement…' : 'Envoyer le signalement'}
              </button>
            </div>

            {(utilisateur?.trustLevel === 'moderator' || utilisateur?.trustLevel === 'super_admin') && (
              <div
                style={{
                  borderRadius: 18,
                  padding: 14,
                  border: '1px solid rgba(255, 102, 102, 0.25)',
                  background: 'linear-gradient(180deg, rgba(255, 102, 102, 0.1), rgba(255, 102, 102, 0.04))',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(255, 151, 151)', marginBottom: 8 }}>
                  Action staff
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Cette action retire immédiatement l’annonce du site. Utilisez-la seulement si une intervention staff est nécessaire.
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%', minHeight: 44 }}
                  onClick={async () => {
                    if (!confirm('Supprimer cette annonce ?')) return;
                    await apiFetch(`/community/forum/topics/${annonce.id}`, { method: 'DELETE' }).catch(() => {});
                    window.location.href = '/annonces';
                  }}
                >
                  Supprimer l'annonce
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
