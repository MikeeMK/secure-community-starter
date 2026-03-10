'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { TrustBadge } from '../../components/Badge';
import { UserProfileTrigger } from '../../components/UserProfileTrigger';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { renderMarkdown } from '../../lib/markdown';
import { copyToClipboard } from '../../lib/copy';

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
};

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
    if (!id) return;
    apiFetch<Annonce>(`/community/forum/topics/${id}`)
      .then((a) => {
        setAnnonce(a);
        setLiked(a.liked);
        setLikeCount(a._count.likes);
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
    } finally {
      setChatLoading(false);
    }
  }

  async function handleCopyRef() {
    await copyToClipboard(annonce?.id ?? '');
    setMenuOpen(false);
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
      <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>&larr; Retour au dashboard</Link>
      <div className="error-text">{erreur}</div>
    </div>
  );
  if (!annonce) return (
    <div style={{ padding: 24 }}>
      <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>&larr; Retour au dashboard</Link>
      <p className="loading-text">Chargement…</p>
    </div>
  );

  const isOwn = utilisateur?.id === annonce.author.id;
  const mainPhoto = annonce.photos?.[photoIndex ?? 0];

  return (
    <>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px' }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 24, display: 'inline-flex' }}>
          &larr; Retour au dashboard
        </Link>

        <div className="card">
          {/* Author row */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
            <Link href={`/profil/${annonce.author.id}`}>
              <Avatar name={annonce.author.displayName} size="md" />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
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
              <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                {annonce.title}
              </h1>
            </div>
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Actions"
                style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ⋮
              </button>
              {menuOpen && (
                <div className="card" style={{ position: 'absolute', right: 0, top: 38, zIndex: 30, padding: 10, width: 220 }}>
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleCopyRef}>
                    Copier la référence
                  </button>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Signaler</div>
                  <select
                    className="form-input"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{ marginBottom: 8 }}
                  >
                    <option>Contenu inapproprié</option>
                    <option>Spam</option>
                    <option>Ne respecte pas le règlement</option>
                    <option>Autre</option>
                  </select>
                  {reportReason === 'Autre' && (
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Motif..."
                      value={reportNote}
                      onChange={(e) => setReportNote(e.target.value)}
                      style={{ marginBottom: 8 }}
                    />
                  )}
                  <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginBottom: 6 }} onClick={handleReport}>
                    Envoyer le signalement
                  </button>
                  {(utilisateur?.trustLevel === 'moderator' || utilisateur?.trustLevel === 'super_admin') && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%' }}
                      onClick={async () => {
                        if (!confirm('Supprimer cette annonce ?')) return;
                        await apiFetch(`/community/forum/topics/${annonce.id}`, { method: 'DELETE' }).catch(() => {});
                        window.location.href = '/annonces';
                      }}
                    >
                      Supprimer l'annonce (staff)
                    </button>
                  )}
                </div>
              )}
              {reportSent && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--primary)' }}>
                  Signalement envoyé, merci.
                </div>
              )}
            </div>
          </div>

          {mainPhoto && (
            <div style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }}>
              <img
                src={mainPhoto}
                alt={annonce.title}
                style={{ width: '100%', maxHeight: 460, objectFit: 'cover', display: 'block' }}
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
                  }}
                >
                  <img src={p} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}

          {/* Body */}
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: 'var(--text)',
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              marginBottom: 24,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(annonce.body) }}
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

            {!isOwn && estAuthentifie && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleChat}
                disabled={chatLoading || chatStarted}
              >
                {chatStarted ? 'Message envoyé ✓' : chatLoading ? 'Connexion…' : '💬 Chat'}
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
          <img
            src={lightbox}
            alt="Aperçu"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
          />
        </div>
      )}
    </>
  );
}
