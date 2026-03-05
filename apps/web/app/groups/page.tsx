'use client';

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';

type Group = {
  id: string;
  name: string;
  isPrivate: boolean;
  createdAt: string;
  _count?: { topics: number };
};

export default function GroupsPage() {
  const [groups, setGroups] = React.useState<Group[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<Group[]>('/community/groups')
      .then(setGroups)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Groups</h1>
        <p className="page-subtitle">Thematic spaces for focused discussions</p>
      </div>

      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}
      {!groups && !error && <p className="loading-text">Loading groups…</p>}

      {groups && groups.length === 0 && (
        <div className="empty-state card">
          <div className="empty-state-icon">&#x1F465;</div>
          <p>No groups yet.</p>
        </div>
      )}

      {groups && groups.length > 0 && (
        <div className="grid-2">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ height: '100%' }}>
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600 }}>{group.name}</h2>
                  {group.isPrivate && (
                    <span className="badge badge-restricted">Private</span>
                  )}
                </div>
                <div className="row" style={{ gap: 12, marginTop: 'auto' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {group._count?.topics ?? 0} topics
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    Since {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
