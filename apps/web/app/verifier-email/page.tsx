'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '../lib/api';

function PageVerifierEmailContent() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [statut, setStatut] = React.useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (!token) {
      setStatut('error');
      setMessage('Token manquant dans le lien.');
      return;
    }
    apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatut('success'))
      .catch((e: unknown) => {
        setStatut('error');
        setMessage(e instanceof Error ? e.message : 'Lien invalide ou expiré.');
      });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card card-lg" style={{ maxWidth: 420, textAlign: 'center' }}>
        {statut === 'pending' && (
          <p style={{ color: 'var(--text-muted)' }}>Vérification en cours…</p>
        )}
        {statut === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Adresse e-mail vérifiée !</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Votre adresse e-mail a bien été confirmée.
            </p>
            <Link href="/forum" className="btn btn-primary" style={{ display: 'inline-block' }}>
              Accéder au forum
            </Link>
          </>
        )}
        {statut === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Lien invalide</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>{message}</p>
            <Link href="/connexion" className="btn btn-primary" style={{ display: 'inline-block' }}>
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PageVerifierEmail() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement…</p></div>}>
      <PageVerifierEmailContent />
    </Suspense>
  );
}
