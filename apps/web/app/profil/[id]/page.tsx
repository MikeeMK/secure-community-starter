'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { UserProfileView, type UserProfileViewData } from '../../components/UserProfileView';

export default function PageProfilUtilisateur() {
  const { id } = useParams<{ id: string }>();
  const { utilisateur } = useAuth();
  const [profil, setProfil] = React.useState<UserProfileViewData | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    apiFetch<UserProfileViewData>(`/users/${id}`)
      .then(setProfil)
      .catch((e) => setErreur(String(e)));
  }, [id]);

  if (erreur) return <div className="error-text">{erreur}</div>;
  if (!profil) return <div className="loading-text">Chargement…</div>;

  return (
    <UserProfileView
      profile={profil}
      mode="page"
      isOwnProfile={utilisateur?.id === profil.id}
    />
  );
}
