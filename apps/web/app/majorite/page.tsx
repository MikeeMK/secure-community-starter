import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AGE_GATE_ACCEPTED,
  AGE_GATE_COOKIE_NAME,
  AGE_GATE_DECLINED,
  normalizeAgeGateRedirectTarget,
} from '../lib/age-gate';

type MajorityPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function MajorityPage({ searchParams }: MajorityPageProps) {
  const nextTarget = normalizeAgeGateRedirectTarget(searchParams?.next);
  const ageGate = cookies().get(AGE_GATE_COOKIE_NAME)?.value;

  if (ageGate === AGE_GATE_ACCEPTED) {
    redirect(nextTarget);
  }

  if (ageGate === AGE_GATE_DECLINED) {
    redirect('/acces-interdit');
  }

  return (
    <div style={{ maxWidth: 640, margin: '64px auto' }}>
      <div
        className="card card-lg"
        style={{
          display: 'grid',
          gap: 24,
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at top, rgba(91,214,200,0.10), transparent 30%), var(--surface)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -50,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.10)',
            filter: 'blur(18px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'grid', gap: 12, textAlign: 'center', position: 'relative' }}>
          <span
            style={{
              width: 84,
              height: 84,
              margin: '0 auto',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              fontWeight: 900,
              color: '#fff',
              background: 'linear-gradient(135deg, #22c55e, #4ade80)',
              boxShadow: '0 16px 40px rgba(34,197,94,0.22)',
            }}
          >
            18+
          </span>
          <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
            Accès réservé aux adultes
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
            Velentra est réservé aux personnes majeures. En continuant, vous confirmez avoir au
            moins 18 ans, accéder à ce site de votre plein gré, comprendre que certains échanges
            peuvent être explicites, et que certaines publications peuvent contenir des images
            sensibles, suggestives ou destinées à un public averti.
          </p>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 'calc(var(--radius) - 2px)',
            background: 'linear-gradient(135deg, rgba(91, 214, 200, 0.10), rgba(91, 214, 200, 0.04))',
            border: '1px solid rgba(91, 214, 200, 0.18)',
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15 }}>En confirmant, vous déclarez notamment :</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
            <li>être majeur selon la législation applicable</li>
            <li>accéder au site de manière libre, volontaire et consentie</li>
            <li>accepter la possible présence de contenus, photos ou discussions pour adultes</li>
          </ul>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <form action="/api/age-gate/accept" method="post">
            <input type="hidden" name="next" value={nextTarget} />
            <button
              type="submit"
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                minHeight: 54,
                background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                color: '#062b14',
                fontWeight: 800,
                border: '1px solid rgba(74, 222, 128, 0.45)',
                boxShadow: '0 12px 28px rgba(34,197,94,0.18)',
              }}
            >
              Oui, j’ai 18 ans ou plus
            </button>
          </form>

          <form action="/api/age-gate/decline" method="post">
            <input type="hidden" name="next" value={nextTarget} />
            <button
              type="submit"
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                minHeight: 54,
                background: 'linear-gradient(135deg, rgba(220,38,38,0.22), rgba(239,68,68,0.16))',
                color: '#fecaca',
                fontWeight: 800,
                border: '1px solid rgba(248,113,113,0.28)',
              }}
            >
              Non, je n’ai pas 18 ans
            </button>
          </form>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
          Cette confirmation est demandée avant l’accès au site.
        </p>
      </div>
    </div>
  );
}
