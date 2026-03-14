'use client';

import React from 'react';

type OAuthProvider = 'google' | 'facebook';

type OAuthButtonsProps = {
  disabled?: boolean;
  isConfigured: boolean;
  onSelect: (provider: OAuthProvider) => void;
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.2 2.5c1.9-1.7 2.9-4.2 2.9-7.3 0-.7-.1-1.4-.2-2H12Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1l-3.3 2.5C4.9 19.7 8.2 22 12 22Z"
      />
      <path
        fill="#4A90E2"
        d="M6.4 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L3.1 7.7C2.4 9 2 10.5 2 12s.4 3 1.1 4.3l3.3-2.5Z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.1c1.4 0 2.7.5 3.7 1.5l2.8-2.8C16.9 3.2 14.7 2 12 2 8.2 2 4.9 4.3 3.1 7.7l3.3 2.5c.8-2.4 3-4.1 5.6-4.1Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.6 22v-8.1h2.7l.4-3.2h-3.1V8.6c0-.9.3-1.5 1.6-1.5h1.7V4.2c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H8v3.2h2.7V22h2.9Z"
      />
    </svg>
  );
}

const PROVIDERS: Array<{
  provider: OAuthProvider;
  label: string;
  hint: string;
  background: string;
  color: string;
  border: string;
  shadow: string;
  Icon: () => React.JSX.Element;
}> = [
  {
    provider: 'google',
    label: 'Continuer avec Google',
    hint: 'Connexion rapide via votre compte Google',
    background: 'linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)',
    color: '#111827',
    border: '1px solid rgba(255,255,255,0.22)',
    shadow: '0 12px 24px rgba(15, 23, 42, 0.18)',
    Icon: GoogleIcon,
  },
  {
    provider: 'facebook',
    label: 'Continuer avec Facebook',
    hint: 'Utiliser Facebook pour créer ou ouvrir votre session',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)',
    color: '#ffffff',
    border: '1px solid rgba(96, 165, 250, 0.45)',
    shadow: '0 14px 28px rgba(37, 99, 235, 0.32)',
    Icon: FacebookIcon,
  },
];

export function OAuthButtons({ disabled = false, isConfigured, onSelect }: OAuthButtonsProps) {
  return (
    <div className="stack" style={{ marginBottom: 18 }}>
      {PROVIDERS.map(({ provider, label, hint, background, color, border, shadow, Icon }) => (
        <button
          key={provider}
          type="button"
          className="btn"
          onClick={() => onSelect(provider)}
          disabled={disabled}
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '44px 1fr 18px',
            alignItems: 'center',
            gap: 12,
            padding: '13px 16px',
            borderRadius: 14,
            background,
            color,
            border,
            boxShadow: shadow,
            opacity: disabled ? 0.7 : 1,
            transition: 'transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease',
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: provider === 'google' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.14)',
              color: provider === 'google' ? '#111827' : '#ffffff',
              boxShadow: provider === 'google'
                ? 'inset 0 0 0 1px rgba(17,24,39,0.08)'
                : 'inset 0 0 0 1px rgba(255,255,255,0.14)',
            }}
          >
            <Icon />
          </span>

          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>{label}</span>
            <span
              style={{
                fontSize: 11,
                lineHeight: 1.35,
                opacity: provider === 'google' ? 0.72 : 0.82,
                marginTop: 2,
              }}
            >
              {hint}
            </span>
          </span>

          <span
            aria-hidden="true"
            style={{
              fontSize: 16,
              fontWeight: 700,
              opacity: provider === 'google' ? 0.45 : 0.75,
            }}
          >
            →
          </span>
        </button>
      ))}

      {!isConfigured && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', margin: 0 }}>
          Variables Supabase absentes dans l&apos;app web. Le clic affichera une erreur tant que la config n&apos;est pas chargée.
        </p>
      )}
    </div>
  );
}
