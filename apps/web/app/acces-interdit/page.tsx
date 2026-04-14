import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AGE_GATE_ACCEPTED,
  AGE_GATE_COOKIE_NAME,
} from '../lib/age-gate';

export default function AccessDeniedPage() {
  const ageGate = cookies().get(AGE_GATE_COOKIE_NAME)?.value;

  if (ageGate === AGE_GATE_ACCEPTED) {
    redirect('/');
  }

  return (
    <div style={{ maxWidth: 560, margin: '64px auto' }}>
      <div className="card card-lg" style={{ display: 'grid', gap: 18, textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>⛔</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
          Acces interdit
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
          L acces a Velentra est strictement reserve aux personnes majeures. Si vous avez indique
          ne pas avoir 18 ans, la navigation sur le site est bloquee sur ce navigateur.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
          Si ce choix etait une erreur et que vous disposez deja d un compte legitime, il faudra
          passer par le support pour debloquer la situation proprement plus tard.
        </p>
      </div>
    </div>
  );
}
