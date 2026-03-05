'use client';

import React from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (target: HTMLElement, config: Record<string, any>) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

const SCRIPT_ID = 'turnstile-api-script';
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available'));
  }
  if (scriptPromise) {
    return scriptPromise;
  }
  const existing = document.getElementById(SCRIPT_ID);
  if (existing && window.turnstile) {
    scriptPromise = Promise.resolve();
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile widget'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

type TurnstileWidgetProps = {
  siteKey: string;
  enabled: boolean;
  onVerify: (token: string | null) => void;
  resetSignal?: string | number;
};

export function TurnstileWidget({ siteKey, enabled, onVerify, resetSignal }: TurnstileWidgetProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const widgetId = React.useRef<number | null>(null);

  const render = React.useCallback(() => {
    if (!window.turnstile || !containerRef.current) return;
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onVerify(token),
      'error-callback': () => onVerify(null),
      'expired-callback': () => onVerify(null),
    });
  }, [onVerify, siteKey]);

  React.useEffect(() => {
    if (!enabled || !siteKey) {
      return;
    }
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled) return;
        render();
      })
      .catch(() => {
        if (!cancelled) {
          onVerify(null);
        }
      });
    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.reset(widgetId.current);
      }
    };
  }, [enabled, render, onVerify, siteKey, resetSignal]);

  return enabled ? <div ref={containerRef} /> : null;
}
