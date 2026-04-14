'use client';

import React from 'react';
import { compressImageFile } from '../../lib/client-image';

type Props = {
  photos: File[];
  primaryIndex: number;
  onChange: (files: File[]) => void;
  onPrimaryChange: (index: number) => void;
};

export function PhotoUploader({ photos, primaryIndex, onChange, onPrimaryChange }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [processingError, setProcessingError] = React.useState<string | null>(null);
  const previews = React.useMemo(
    () => photos.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [photos],
  );

  React.useEffect(() => () => {
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    setProcessing(true);
    setProcessingError(null);

    try {
      const remaining = Math.max(0, 5 - photos.length);
      const selected = Array.from(list).slice(0, remaining);
      const optimized = await Promise.all(selected.map((file) => compressImageFile(file)));
      const next = [...photos, ...optimized].slice(0, 5);
      onChange(next);
      if (primaryIndex >= next.length) {
        onPrimaryChange(0);
      }
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : 'Impossible de préparer ces images.');
    } finally {
      setProcessing(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div className="card card-sm" style={{ borderStyle: 'dashed', borderColor: 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Photos (5 max.)</div>
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => inputRef.current?.click()}
          disabled={processing || photos.length >= 5}
        >
          {processing ? 'Optimisation...' : 'Sélectionner des fichiers'}
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
        Ajoutez jusqu à 5 photos. Elles sont réduites automatiquement avant l envoi pour eviter les erreurs de taille, puis vous choisissez la photo principale.
      </p>
      {processing && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          Optimisation des photos en cours...
        </div>
      )}
      {processingError && (
        <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>
          {processingError}
        </div>
      )}
      {previews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 10 }}>
          {previews.map(({ file, url }, idx) => (
            <div key={file.name + idx} style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 8,
              background: 'var(--surface-2)',
              position: 'relative',
              display: 'grid',
              gap: 8,
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--surface-3)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={file.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                {file.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {(file.size / 1024).toFixed(1)} Ko
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={idx === primaryIndex ? 'btn btn-primary btn-xs' : 'btn btn-secondary btn-xs'}
                  onClick={() => onPrimaryChange(idx)}
                  style={{ padding: '4px 8px', fontSize: 11 }}
                >
                  {idx === primaryIndex ? 'Principale' : 'Définir principale'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    const next = photos.filter((_, i) => i !== idx);
                    onChange(next);
                    if (idx === primaryIndex) {
                      onPrimaryChange(0);
                    } else if (idx < primaryIndex) {
                      onPrimaryChange(primaryIndex - 1);
                    }
                  }}
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
