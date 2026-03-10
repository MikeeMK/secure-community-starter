'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  updatedAt: string;
};

export default function FaqDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = React.useState<FaqItem | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    apiFetch<FaqItem>(`/faq/${id}`)
      .then(setItem)
      .catch((e) => setError(String(e)));
  }, [id]);

  if (error) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
        <Link href="/faq" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
          ← Retour à la FAQ
        </Link>
        <div className="error-text">{error}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
        <p className="loading-text">Chargement…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/faq" className="btn btn-ghost btn-sm">← Retour à la FAQ</Link>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Mis à jour le {new Date(item.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className="tag tag-muted">{item.category}</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{item.question}</h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)' }}>
          {item.answer}
        </div>
      </div>
    </div>
  );
}
