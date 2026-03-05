'use client';

import React from 'react';
import { apiFetch } from '../lib/api';

type OnlineUser = { id: string; displayName: string; lastActiveAt: string };
type NewMember = { id: string; displayName: string; createdAt: string };
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
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

function activityLabel(item: ActivityItem) {
  if (item.type === 'register') return `${item.actor} a rejoint la communauté`;
  if (item.type === 'topic') return `${item.actor} a créé "${item.label}"`;
  return `${item.actor} a répondu dans "${item.label}"`;
}

function activityIcon(type: ActivityItem['type']) {
  if (type === 'register') return '👋';
  if (type === 'topic') return '💬';
  return '↩️';
}

function MiniAvatar({ name }: { name: string }) {
  return (
    <div className="sidebar-avatar">
      {initials(name)}
    </div>
  );
}

export function HomeSidebar() {
  const [data, setData] = React.useState<SidebarData | null>(null);

  React.useEffect(() => {
    function load() {
      apiFetch<SidebarData>('/community/sidebar')
        .then(setData)
        .catch(() => {});
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const online = data?.onlineUsers ?? [];
  const members = data?.newMembers ?? [];
  const activity = data?.activity ?? [];

  return (
    <aside className="home-sidebar">

      {/* Members Online */}
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <span className="sidebar-online-dot" />
          <span className="sidebar-card-title">Membres en ligne</span>
          <span className="sidebar-count">({online.length})</span>
        </div>
        {online.length === 0 ? (
          <div className="sidebar-empty">
            <span className="sidebar-empty-icon">🌙</span>
            <span>Aucun membre en ligne</span>
          </div>
        ) : (
          <ul className="sidebar-list">
            {online.map((u) => (
              <li key={u.id} className="sidebar-list-item">
                <div className="sidebar-avatar-wrap">
                  <MiniAvatar name={u.displayName} />
                  <span className="sidebar-online-indicator" />
                </div>
                <span className="sidebar-item-name">{u.displayName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* New Members */}
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <span className="sidebar-card-icon">✨</span>
          <span className="sidebar-card-title">Nouveaux membres</span>
          <span className="sidebar-count">({members.length})</span>
        </div>
        {members.length === 0 ? (
          <div className="sidebar-empty">
            <span className="sidebar-empty-icon">🚪</span>
            <span>Aucun membre pour l'instant</span>
          </div>
        ) : (
          <ul className="sidebar-list">
            {members.map((m) => (
              <li key={m.id} className="sidebar-list-item">
                <MiniAvatar name={m.displayName} />
                <div className="sidebar-item-info">
                  <span className="sidebar-item-name">{m.displayName}</span>
                  <span className="sidebar-item-time">{timeAgo(m.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Activity */}
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <span className="sidebar-card-icon">⚡</span>
          <span className="sidebar-card-title">Activité récente</span>
          <span className="sidebar-count">({activity.length})</span>
        </div>
        {activity.length === 0 ? (
          <div className="sidebar-empty">
            <span className="sidebar-empty-icon">💤</span>
            <span>Aucune activité pour l'instant</span>
          </div>
        ) : (
          <ul className="sidebar-activity-list">
            {activity.map((item) => (
              <li key={item.id} className="sidebar-activity-item">
                <span className="sidebar-activity-icon">{activityIcon(item.type)}</span>
                <div className="sidebar-activity-body">
                  <span className="sidebar-activity-text">{activityLabel(item)}</span>
                  <span className="sidebar-item-time">{timeAgo(item.at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </aside>
  );
}
