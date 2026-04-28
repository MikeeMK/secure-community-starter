'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Avatar } from '../components/Avatar';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Notif = {
  id: string;
  title?: string | null;
  content?: string | null;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type Conversation = {
  id: string;
  announcementId: string | null;
  announcement: { id: string; title: string } | null;
  other: { id: string; displayName: string };
  lastMsg: { content: string; createdAt: string; senderId: string; read: boolean } | null;
  unread: number;
};

type ChatMsg = {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: { id: string; displayName: string };
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function MessageriePage() {
  const { utilisateur } = useAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = React.useState<'messages' | 'notifications'>('messages');

  // Conversations
  const [convs, setConvs] = React.useState<Conversation[] | null>(null);
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [msgInput, setMsgInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Notifications
  const [notifs, setNotifs] = React.useState<Notif[] | null>(null);
  const [selectedNotifs, setSelectedNotifs] = React.useState<Set<string>>(new Set());

  // Load conversations
  React.useEffect(() => {
    apiFetch<Conversation[]>('/chat/conversations')
      .then(setConvs)
      .catch(() => setConvs([]));
    apiFetch<Notif[]>('/notifications')
      .then((data) => setNotifs([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
      .catch(() => setNotifs([]));
  }, []);

  // Auto-select conversation from URL param
  React.useEffect(() => {
    const convParam = searchParams.get('conv');
    if (convParam) {
      setActiveConvId(convParam);
      setTab('messages');
    }
  }, [searchParams]);

  // Fetch messages when active conv changes
  const fetchMessages = React.useCallback(() => {
    if (!activeConvId) return;
    apiFetch<ChatMsg[]>(`/chat/${activeConvId}/messages`)
      .then(setMessages)
      .catch(() => {});
  }, [activeConvId]);

  React.useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeConvId) { setMessages([]); return; }
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConvId, fetchMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim() || !activeConvId) return;
    setSending(true);
    const content = msgInput;
    setMsgInput('');
    try {
      const msg = await apiFetch<ChatMsg>(`/chat/${activeConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setMessages((prev) => [...prev, msg]);
      // Update last message in conv list
      setConvs((prev) => prev?.map((c) =>
        c.id === activeConvId
          ? { ...c, lastMsg: { content, createdAt: new Date().toISOString(), senderId: utilisateur?.id ?? '', read: false } }
          : c
      ) ?? null);
    } catch (err) {
      setMsgInput(content);
      alert(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  }

  async function deleteSelectedNotifs() {
    const ids = Array.from(selectedNotifs);
    await Promise.all(ids.map((id) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }).catch(() => {})));
    setNotifs((prev) => prev?.filter((n) => !selectedNotifs.has(n.id)) ?? []);
    setSelectedNotifs(new Set());
  }

  const activeConv = convs?.find((c) => c.id === activeConvId) ?? null;
  const totalUnread = convs?.reduce((s, c) => s + c.unread, 0) ?? 0;
  const unreadNotifs = notifs?.filter((n) => !n.read).length ?? 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn btn-sm ${tab === 'messages' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('messages')}
          style={{ position: 'relative' }}
        >
          Messages
          {totalUnread > 0 && tab !== 'messages' && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: 'var(--danger)', color: '#fff',
              fontSize: 10, fontWeight: 700, borderRadius: 99,
              minWidth: 16, height: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            }}>{totalUnread > 9 ? '9+' : totalUnread}</span>
          )}
        </button>
        <button
          className={`btn btn-sm ${tab === 'notifications' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('notifications')}
          style={{ position: 'relative' }}
        >
          Notifications
          {unreadNotifs > 0 && tab !== 'notifications' && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: 'var(--danger)', color: '#fff',
              fontSize: 10, fontWeight: 700, borderRadius: 99,
              minWidth: 16, height: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
          )}
        </button>
      </div>

      {/* Messages tab */}
      {tab === 'messages' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeConvId ? '300px 1fr' : '1fr',
          gap: 16,
          minHeight: 560,
        }}>
          {/* Conversation list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 15 }}>
              Conversations
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {!convs && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Chargement…</div>
              )}
              {convs && convs.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
                  Aucune conversation pour le moment.
                  <div style={{ marginTop: 10, fontSize: 12 }}>
                    Contactez quelqu'un depuis une <Link href="/annonces" style={{ color: 'var(--primary)' }}>annonce</Link>.
                  </div>
                </div>
              )}
              {convs?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                    borderBottom: '1px solid var(--border)',
                    background: activeConvId === c.id ? 'var(--surface-2)' : 'transparent',
                    borderLeft: activeConvId === c.id ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <Avatar name={c.other.displayName} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: c.unread > 0 ? 800 : 600, fontSize: 14, color: 'var(--text)' }}>
                        {c.other.displayName}
                      </span>
                      {c.lastMsg && (
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0, marginLeft: 6 }}>
                          {timeAgo(c.lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {c.announcement && (
                      <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Re: {c.announcement.title}
                      </div>
                    )}
                    {c.lastMsg && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {c.lastMsg.senderId === utilisateur?.id ? 'Vous : ' : ''}{c.lastMsg.content}
                      </div>
                    )}
                  </div>
                  {c.unread > 0 && (
                    <span style={{
                      background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700,
                      borderRadius: 99, minWidth: 18, height: 18, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0,
                    }}>{c.unread}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message thread */}
          {activeConvId && (
            <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 560 }}>
              {/* Thread header */}
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)', flexShrink: 0,
              }}>
                <button
                  onClick={() => setActiveConvId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, padding: 0, lineHeight: 1 }}
                  title="Retour"
                >←</button>
                {activeConv && <Avatar name={activeConv.other.displayName} size="sm" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {activeConv ? (
                      <Link href={`/profil/${activeConv.other.id}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                        {activeConv.other.displayName}
                      </Link>
                    ) : '…'}
                  </div>
                  {activeConv?.announcement && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Re:{' '}
                      <Link href={`/annonces/${activeConv.announcement.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {activeConv.announcement.title}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, marginTop: 32 }}>
                    Aucun message. Envoyez le premier !
                  </div>
                )}
                {messages.map((m) => {
                  const isMe = m.sender.id === utilisateur?.id;
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end' }}>
                      {!isMe && <Avatar name={m.sender.displayName} size="sm" />}
                      <div style={{ maxWidth: '68%' }}>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMe ? 'var(--primary)' : 'var(--surface-3)',
                          color: isMe ? '#fff' : 'var(--text)',
                          fontSize: 14,
                          lineHeight: 1.55,
                          wordBreak: 'break-word',
                        }}>
                          {m.content}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                          {timeAgo(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply form */}
              <form
                onSubmit={handleSend}
                style={{
                  display: 'flex', gap: 10, padding: '12px 16px',
                  borderTop: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0,
                }}
              >
                <input
                  className="form-input"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Votre réponse…"
                  style={{ flex: 1, fontSize: 14 }}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={sending || !msgInput.trim()}
                  style={{ flexShrink: 0, paddingLeft: 16, paddingRight: 16 }}
                >
                  {sending ? '…' : 'Envoyer'}
                </button>
              </form>
            </div>
          )}

          {/* Empty state when no conv selected */}
          {!activeConvId && convs && convs.length > 0 && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                Sélectionnez une conversation
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <div className="card" style={{ padding: 16, maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Notifications</h2>
            {selectedNotifs.size > 0 && (
              <button className="btn btn-danger btn-xs" onClick={deleteSelectedNotifs}>
                Supprimer ({selectedNotifs.size})
              </button>
            )}
          </div>

          {notifs && notifs.length > 0 && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedNotifs.size === notifs.length}
                onChange={(e) => setSelectedNotifs(e.target.checked ? new Set(notifs.map((n) => n.id)) : new Set())}
              />
              Tout sélectionner
            </label>
          )}

          {!notifs && <p className="loading-text">Chargement…</p>}
          {notifs && notifs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucune notification pour l'instant.</p>}

          {notifs?.map((n) => (
            <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={selectedNotifs.has(n.id)}
                onChange={() => setSelectedNotifs((prev) => {
                  const next = new Set(prev);
                  next.has(n.id) ? next.delete(n.id) : next.add(n.id);
                  return next;
                })}
                style={{ marginTop: 4, flexShrink: 0 }}
              />
              {!n.read && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                {n.link ? (
                  <Link href={n.link} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{n.title ?? n.message}</div>
                    {n.content && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.content}</div>}
                  </Link>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{n.title ?? n.message}</div>
                    {n.content && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.content}</div>}
                  </>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
