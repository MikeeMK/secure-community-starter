'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

type Notif = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
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

export function NotificationsPanel() {
  const [notifs, setNotifs] = React.useState<Notif[] | null>(null);
  const [marking, setMarking] = React.useState(false);

  function refresh() {
    apiFetch<Notif[]>('/notifications')
      .then((data) => setNotifs(data.filter((n) => !n.read).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
      .catch(() => setNotifs([]));
  }

  React.useEffect(() => { refresh(); }, []);

  async function markAllRead() {
    setMarking(true);
    await apiFetch('/notifications/read-all', { method: 'PATCH' }).catch(() => {});
    refresh();
    setMarking(false);
  }

  const unread = notifs?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
          {unread > 0 && (
            <span style={{
              background: 'var(--danger)', color: '#fff',
              fontSize: 11, fontWeight: 700, borderRadius: 99,
              padding: '1px 6px',
            }}>{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Tout lire
          </button>
        )}
      </div>

      {!notifs && <p className="loading-text" style={{ fontSize: 13 }}>Chargement…</p>}

      {notifs && notifs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-dim)', fontSize: 13 }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🔕</div>
          Aucune notification pour l'instant
        </div>
      )}

      {notifs && notifs.slice(0, 5).map((n) => (
        <div
          key={n.id}
          style={{
            padding: '9px 0',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            opacity: n.read ? 0.6 : 1,
          }}
        >
          {!n.read && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', marginTop: 5, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            {n.link ? (
              <Link href={n.link} style={{ fontSize: 13, color: 'var(--text-base)', textDecoration: 'none', lineHeight: 1.4 }}>
                {n.message}
              </Link>
            ) : (
              <span style={{ fontSize: 13, lineHeight: 1.4 }}>{n.message}</span>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
          </div>
        </div>
      ))}

      {notifs && notifs.length > 5 && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Link href="/messagerie#notifications" className="btn btn-ghost btn-sm">
            Voir plus
          </Link>
        </div>
      )}
    </div>
  );
}
