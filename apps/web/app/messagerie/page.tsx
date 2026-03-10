'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';

type Notif = { id: string; message: string; link: string | null; read: boolean; createdAt: string };
type Msg = { id: string; other: { id: string; displayName: string }; lastMsg?: { content: string; createdAt: string; senderId: string; read: boolean } | null; unread: number };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export default function MessageriePage() {
  const [tab, setTab] = React.useState<'notifications' | 'messages' | 'chat'>('notifications');
  const [notifs, setNotifs] = React.useState<Notif[] | null>(null);
  const [messages, setMessages] = React.useState<Msg[] | null>(null);
  const [selectedNotifs, setSelectedNotifs] = React.useState<Set<string>>(new Set());
  const [selectedMessages, setSelectedMessages] = React.useState<Set<string>>(new Set());
  const [selectAllNotifs, setSelectAllNotifs] = React.useState(false);
  const [selectAllMsgs, setSelectAllMsgs] = React.useState(false);

  React.useEffect(() => {
    apiFetch<Notif[]>('/notifications')
      .then((data) => setNotifs([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
      .catch(() => setNotifs([]));

    apiFetch<Msg[]>('/chat/conversations')
      .then((data) => setMessages(data))
      .catch(() => setMessages([]));
  }, []);

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function deleteSelectedNotifs() {
    const ids = Array.from(selectedNotifs);
    await Promise.all(ids.map((id) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }).catch(() => {})));
    setNotifs((prev) => prev?.filter((n) => !selectedNotifs.has(n.id)) ?? []);
    setSelectedNotifs(new Set());
    setSelectAllNotifs(false);
  }

  async function deleteSelectedMessages() {
    const ids = Array.from(selectedMessages);
    await Promise.all(ids.map((id) => apiFetch(`/chat/${id}`, { method: 'DELETE' }).catch(() => {})));
    setMessages((prev) => prev?.filter((m) => !selectedMessages.has(m.id)) ?? []);
    setSelectedMessages(new Set());
    setSelectAllMsgs(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`btn btn-sm ${tab === 'notifications' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('notifications')}>
          Notifications
        </button>
        <button className={`btn btn-sm ${tab === 'messages' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('messages')}>
          Messagerie
        </button>
        <button className={`btn btn-sm ${tab === 'chat' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('chat')}>
          Chat
        </button>
      </div>

      {tab === 'notifications' && (
        <div className="card" style={{ padding: 12, maxHeight: 520, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Notifications</h2>
          {notifs && notifs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={selectAllNotifs}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAllNotifs(checked);
                    setSelectedNotifs(checked ? new Set(notifs.map((n) => n.id)) : new Set());
                  }}
                />
                Sélectionner tout
              </label>
              {selectedNotifs.size > 0 && (
                <button className="btn btn-danger btn-xs" onClick={deleteSelectedNotifs}>
                  Supprimer ({selectedNotifs.size})
                </button>
              )}
            </div>
          )}
          {!notifs && <p className="loading-text">Chargement…</p>}
          {notifs && notifs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucune notification pour l'instant.</p>}
          {notifs && notifs.map((n) => (
            <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedNotifs.has(n.id)}
                onChange={() => toggleSet(setSelectedNotifs, n.id)}
                style={{ marginTop: 6 }}
              />
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6 }} />}
              <div style={{ flex: 1 }}>
                {n.link ? (
                  <Link href={n.link} style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'none', lineHeight: 1.5 }}>
                    {n.message}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--text)' }}>{n.message}</span>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'messages' && (
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Messagerie</h2>
          {messages && messages.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={selectAllMsgs}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAllMsgs(checked);
                    setSelectedMessages(checked ? new Set(messages.map((m) => m.id)) : new Set());
                  }}
                />
                Sélectionner tout
              </label>
              {selectedMessages.size > 0 && (
                <button className="btn btn-danger btn-xs" onClick={deleteSelectedMessages}>
                  Supprimer ({selectedMessages.size})
                </button>
              )}
            </div>
          )}
          {!messages && <p className="loading-text">Chargement…</p>}
          {messages && messages.length === 0 && (
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              La messagerie intégrée arrive : les échanges depuis les annonces seront affichés ici sous forme de fils organisés.
            </p>
          )}
          {messages && messages.length > 0 && (
            <div className="stack" style={{ gap: 10 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedMessages.has(m.id)}
                    onChange={() => toggleSet(setSelectedMessages, m.id)}
                    style={{ marginTop: 6 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{m.from}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>{m.preview}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{timeAgo(m.createdAt)}</div>
                  </div>
                  {m.unread && <span className="tag tag-primary" style={{ fontSize: 11 }}>Non lu</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'chat' && (
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Chat</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
            Cliquez sur la bulle de chat en bas à droite pour ouvrir le chat en direct.
          </p>
        </div>
      )}
    </div>
  );
}
