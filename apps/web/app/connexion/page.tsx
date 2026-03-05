import { Suspense } from 'react';
import ConnexionClient from './ConnexionClient';

export default function PageConnexion() {
  return (
    <Suspense fallback={null}>
      <ConnexionClient />
    </Suspense>
  );
}
