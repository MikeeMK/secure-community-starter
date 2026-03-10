'use client';

import React from 'react';

type Props = {
  photos: File[];
  onChange: (files: File[]) => void;
};

export function PhotoUploader({ photos, onChange }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).slice(0, 5);
    onChange(arr);
  }

  return (
    <div className="card card-sm" style={{ borderStyle: 'dashed', borderColor: 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Photos (5 max.)</div>
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => inputRef.current?.click()}
        >
          Sélectionner des fichiers
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        Formats image. La première deviendra la photo principale. Vous pourrez en ajouter jusqu'à 5.
      </p>
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 10 }}>
          {photos.map((f, idx) => (
            <div key={f.name + idx} style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 8,
              background: 'var(--surface-2)',
              position: 'relative',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, wordBreak: 'break-word' }}>
                {f.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {(f.size / 1024).toFixed(1)} Ko
              </div>
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                {idx === 0 && <span className="tag tag-primary" style={{ fontSize: 10 }}>Principale</span>}
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => onChange(photos.filter((_, i) => i !== idx))}
                  style={{ padding: '2px 6px', fontSize: 11 }}
                  title="Retirer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
