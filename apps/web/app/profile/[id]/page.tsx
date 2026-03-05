'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '../../components/Avatar';
import { TrustBadge } from '../../components/Badge';
import { apiFetch } from '../../lib/api';

type UserProfile = {
  id: string;
  displayName: string;
  trustLevel: 'new' | 'normal' | 'trusted' | 'restricted';
  createdAt: string;
  bio?: string;
  forumTopics: { id: string; title: string; createdAt: string }[];
  forumPosts: { id: string; body: string; createdAt: string; topic: { id: string; title: string } }[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<'topics' | 'posts'>('topics');

  React.useEffect(() => {
    if (!id) return;
    apiFetch<UserProfile>(`/users/${id}`)
      .then(setUser)
      .catch((e) => setError(String(e)));
  }, [id]);

  if (error) return (
    <div>
      <div className="error-text">{error}</div>
    </div>
  );

  if (!user) return <p className="loading-text">Loading profile…</p>;

  return (
    <div className="stack-lg">
      {/* Profile card */}
      <div className="card">
        <div className="row" style={{ gap: 20, flexWrap: 'wrap' }}>
          <Avatar name={user.displayName} size="xl" />
          <div style={{ flex: 1 }}>
            <div className="row" style={{ marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>{user.displayName}</h1>
              <TrustBadge level={user.trustLevel} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>
              Member since {formatDate(user.createdAt)}
            </p>
            {user.bio && (
              <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>{user.bio}</p>
            )}
            {!user.bio && (
              <p style={{ color: 'var(--text-dim)', fontSize: 14, fontStyle: 'italic' }}>No bio yet.</p>
            )}
          </div>
        </div>

        <hr className="divider" />

        <div className="row" style={{ gap: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{user.forumTopics.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Topics</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{user.forumPosts.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Replies</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="row" style={{ gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {(['topics', 'posts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: tab === t ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {t === 'topics' ? 'Topics' : 'Replies'}
            </button>
          ))}
        </div>

        {tab === 'topics' && (
          <div className="card">
            {user.forumTopics.length === 0 && (
              <div className="empty-state">No topics yet.</div>
            )}
            {user.forumTopics.map((topic) => (
              <div key={topic.id} className="topic-item">
                <div style={{ flex: 1 }}>
                  <Link href={`/forum/${topic.id}`} className="topic-title" style={{ display: 'block', marginBottom: 4 }}>
                    {topic.title}
                  </Link>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(topic.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'posts' && (
          <div className="card">
            {user.forumPosts.length === 0 && (
              <div className="empty-state">No replies yet.</div>
            )}
            {user.forumPosts.map((post) => (
              <div key={post.id} className="post-item" style={{ flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Reply in{' '}
                  <Link href={`/forum/${post.topic.id}`}>{post.topic.title}</Link>
                  {' '}· {new Date(post.createdAt).toLocaleDateString()}
                </div>
                <p className="post-body" style={{ fontSize: 13 }}>
                  {post.body.length > 200 ? post.body.slice(0, 200) + '…' : post.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
