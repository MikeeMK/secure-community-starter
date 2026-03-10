'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { RichTextarea } from '../../components/RichTextarea';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  published: boolean;
};

const FAQ_CATEGORIES = ['Compte', 'Sécurité', 'Rencontres', 'Annonces', 'Tokens', 'Abonnements', 'Modération', 'Confidentialité'];

const EMPTY_FORM = { question: '', answer: '', category: 'Compte', displayOrder: 0, published: true };

export default function AdminFaqPage() {
  const { utilisateur } = useAuth();
  const router = useRouter();
  const [items, setItems] = React.useState<FaqItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    if (!utilisateur) return;
    const isStaff = utilisateur.trustLevel === 'moderator' || utilisateur.trustLevel === 'super_admin';
    if (!isStaff) { router.push('/dashboard'); return; }
    fetchItems();
  }, [utilisateur, router]);

  async function fetchItems() {
    setLoading(true);
    apiFetch<FaqItem[]>('/faq/all').then(setItems).catch(() => {}).finally(() => setLoading(false));
  }

  function startEdit(item: FaqItem) {
    setEditingId(item.id);
    setForm({ question: item.question, answer: item.answer, category: item.category, displayOrder: item.displayOrder, published: item.published });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.question.trim().length < 5 || form.answer.trim().length < 10) {
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/faq/${editingId}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await apiFetch('/faq', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowForm(false);
      setEditingId(null);
      fetchItems();
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette question ?')) return;
    await apiFetch(`/faq/${id}`, { method: 'DELETE' }).catch(() => {});
    fetchItems();
  }

  async function togglePublished(item: FaqItem) {
    await apiFetch(`/faq/${item.id}`, { method: 'PATCH', body: JSON.stringify({ published: !item.published }) }).catch(() => {});
    fetchItems();
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FaqItem[]>);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Gestion FAQ</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{items.length} question{items.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={startNew}>+ Nouvelle question</button>
      </div>

      {/* Edit / Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 28, border: '2px solid var(--primary)', borderRadius: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>
            {editingId ? 'Modifier la question' : 'Nouvelle question'}
          </div>
          <form onSubmit={handleSave} className="stack">
            <div className="form-group">
              <label className="form-label">Question</label>
              <input
                className="form-input"
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder="La question que se posent les membres…"
                required minLength={5} maxLength={300}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Réponse</label>
              <RichTextarea
                value={form.answer}
                onChange={(v) => setForm((f) => ({ ...f, answer: v }))}
                rows={6}
                placeholder="Réponse complète et claire…"
              />
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                <label className="form-label">Catégorie</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ minWidth: 100 }}>
                <label className="form-label">Ordre</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
                  style={{ maxWidth: 90 }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 2 }}>
                <input
                  type="checkbox"
                  id="published"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />
                <label htmlFor="published" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Publié</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQ list */}
      {loading && <p className="loading-text">Chargement…</p>}
      {!loading && items.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Aucune question pour l'instant. Créez-en une !</p>
        </div>
      )}
      <div className="stack">
        {Object.keys(grouped).sort().map((cat) => (
          <div key={cat}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, marginTop: 4 }}>
              {cat}
            </div>
            {grouped[cat].map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 8, opacity: item.published ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      {!item.published && <span style={{ fontSize: 11, background: 'var(--border)', borderRadius: 4, padding: '1px 6px', marginRight: 6, color: 'var(--text-dim)' }}>Masqué</span>}
                      {item.question}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.answer}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => togglePublished(item)}
                      title={item.published ? 'Masquer' : 'Publier'}
                    >
                      {item.published ? '👁 Masquer' : '👁 Publier'}
                    </button>
                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => startEdit(item)}>
                      Modifier
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                      onClick={() => handleDelete(item.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
