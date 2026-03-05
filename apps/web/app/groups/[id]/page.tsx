'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { TrustBadge } from '../../components/Badge';
import { apiFetch } from '../../lib/api';

type Topic = {
  id: string;
  title: string;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string };
};

type Group = {
  id: string;
  name: string;
  isPrivate: boolean;
  createdAt: string;
  topics: Topic[];
};

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = React.useState<Group | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    apiFetch<Group>(`/community/groups/${id}`)
      .then(setGroup)
      .catch((e) => setError(String(e)));
  }, [id]);

  if (error) return (
    <div>
      <Link href="/groups" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>&larr; Groups</Link>
      <div className="error-text">{error}</div>
    </div>
  );

  if (!group) return (
    <div>
      <Link href="/groups" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>&larr; Groups</Link>
      <p className="loading-text">Loading…</p>
    </div>
  );

  return (
    <div className="stack-lg">
      <div>
        <Link href="/groups" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>&larr; Groups</Link>

        <div className="card">
          <div className="row-between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{group.name}</h1>
            {group.isPrivate && <span className="badge badge-restricted">Private</span>}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Created {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {' '}· {group.topics.length} topics
          </p>
        </div>
      </div>

      <div>
        <div className="section-title">Topics in this group</div>

        {group.topics.length === 0 && (
          <div className="empty-state card">
            <div className="empty-state-icon">&#x1F4DD;</div>
            <p>No topics in this group yet.</p>
          </div>
        )}

        {group.topics.length > 0 && (
          <div className="card">
            {group.topics.map((topic) => (
              <Link key={topic.id} href={`/forum/${topic.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div className="topic-item card-hover" style={{ borderRadius: 0, padding: '14px 0' }}>
                  <Avatar name={topic.author.displayName} size="md" />
                  <div style={{ flex: 1 }}>
                    <div className="topic-title">{topic.title}</div>
                    <div className="topic-meta">
                      <span>{topic.author.displayName}</span>
                      <TrustBadge level={topic.author.trustLevel as 'new' | 'normal' | 'trusted' | 'restricted'} />
                      <span className="topic-separator">·</span>
                      <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
