'use client';

import React from 'react';

type Topic = {
  id: string;
  title: string;
  createdAt: string;
  author: { id: string; displayName: string; trustLevel: string };
  group: { id: string; name: string } | null;
};

export function TopicsList() {
  const [topics, setTopics] = React.useState<Topic[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
    fetch(`${base}/community/forum/topics`)
      .then((r) => r.json())
      .then((d) => setTopics(d))
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div style={{ color: 'crimson' }}>Erreur: {err}</div>;
  if (!topics) return <div>Chargement…</div>;

  return (
    <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ margin: 0 }}>Forum (exemple)</h2>
        <a href="http://localhost:4000/health" target="_blank" rel="noreferrer">
          API health
        </a>
      </div>

      <ul style={{ paddingLeft: 16 }}>
        {topics.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong>
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              par {t.author.displayName} ({t.author.trustLevel}) • {new Date(t.createdAt).toLocaleString()}
              {t.group ? ` • ${t.group.name}` : ''}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
