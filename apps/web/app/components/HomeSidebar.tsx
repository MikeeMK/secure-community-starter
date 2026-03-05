'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';

type OnlineUser = { id: string; displayName: string; lastActiveAt: string };
type NewMember  = { id: string; displayName: string; createdAt: string };
type ActivityItem = {
  type: 'topic' | 'post' | 'register';
  id: string;
  actorId: string;
  actor: string;
  label: string | null;
  at: string;
};
type SidebarData = {
  onlineUsers: OnlineUser[];
  newMembers: NewMember[];
  activity: ActivityItem[];
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function activityText(item: ActivityItem) {
  if (item.type === 'register') return 'a rejoint la communauté';
  if (item.type === 'topic') return `a créé "${item.label}"`;
  return `a répondu dans "${item.label}"`;
}

function activityIcon(type: ActivityItem['type']) {
  if (type === 'register') return '👋';
  if (type === 'topic') return '💬';
  return '↩️';
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = [
    'linear-gradient(135deg,#f472b6,#ec4899)',
    'linear-gradient(135deg,#60a5fa,#3b82f6)',
    'linear-gradient(135deg,#fb923c,#f97316)',
    'linear-gradient(135deg,#34d399,#10b981)',
    'linear-gradient(135deg,#a78bfa,#8b5cf6)',
    'linear-gradient(135deg,#f87171,#ef4444)',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colors[idx],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size * 0.35,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="sb-section-title">{children}</h3>;
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="sb-empty">
      <span className="sb-empty-icon">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

export function HomeSidebar() {
  const [data, setData] = React.useState<SidebarData | null>(null);

  React.useEffect(() => {
    function load() {
      apiFetch<SidebarData>('/community/sidebar').then(setData).catch(() => {});
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const online  = data?.onlineUsers ?? [];
  const members = data?.newMembers  ?? [];
  const activity = data?.activity   ?? [];

  return (
    <aside className="home-sidebar">

      {/* ── Membres en ligne ── */}
      <section className="sb-section">
        <SectionTitle>
          <span className="sb-online-pulse" />
          Membres en ligne
          <span className="sb-count">{online.length}</span>
        </SectionTitle>

        {online.length === 0 ? (
          <EmptyState icon="🌙" text="Aucun membre en ligne" />
        ) : (
          <ul className="sb-list">
            {online.map((u) => (
              <li key={u.id} className="sb-row">
                <div className="sb-avatar-wrap">
                  <Avatar name={u.displayName} size={40} />
                  <span className="sb-online-dot" />
                </div>
                <div className="sb-info">
                  <span className="sb-name">{u.displayName}</span>
                  <span className="sb-sub">En ligne</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="sb-divider" />

      {/* ── Nouveaux membres ── */}
      <section className="sb-section">
        <SectionTitle>
          Nouveaux membres
          <span className="sb-count">{members.length}</span>
        </SectionTitle>

        {members.length === 0 ? (
          <EmptyState icon="🚪" text="Aucun membre pour l'instant" />
        ) : (
          <ul className="sb-list">
            {members.map((m) => (
              <li key={m.id} className="sb-row sb-row-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Avatar name={m.displayName} size={40} />
                  <div className="sb-info">
                    <span className="sb-name">{m.displayName}</span>
                    <span className="sb-sub">{timeAgo(m.createdAt)}</span>
                  </div>
                </div>
                <Link href="/forum" className="sb-btn-discuter">
                  ♥ Discuter
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="sb-divider" />

      {/* ── Activité récente ── */}
      <section className="sb-section">
        <SectionTitle>
          Activité récente
          <span className="sb-count">{activity.length}</span>
        </SectionTitle>

        {activity.length === 0 ? (
          <EmptyState icon="💤" text="Aucune activité pour l'instant" />
        ) : (
          <ul className="sb-list">
            {activity.map((item) => (
              <li key={item.id} className="sb-row">
                <div className="sb-avatar-wrap">
                  <Avatar name={item.actor} size={36} />
                  <span className="sb-activity-icon">{activityIcon(item.type)}</span>
                </div>
                <div className="sb-info">
                  <span className="sb-name">{item.actor}</span>
                  <span className="sb-sub">{activityText(item)}</span>
                  <span className="sb-time">{timeAgo(item.at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

    </aside>
  );
}
