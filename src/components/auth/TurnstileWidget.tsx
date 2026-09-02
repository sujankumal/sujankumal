'use client';

import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: unknown) => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (err: unknown) => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  className = 'my-3 flex justify-center',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    throw new Error('Cloudflare Turnstile site key is not configured');
  }

  useEffect(() => {
    let isMounted = true;

    function initTurnstile() {
      if (!window.turnstile || !containerRef.current || !isMounted) return;

      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey || '',
          theme: 'dark',
          callback: (token: string) => {
            if (isMounted) onVerify(token);
          },
          'expired-callback': () => {
            if (isMounted && onExpire) onExpire();
          },
          'error-callback': (err: unknown) => {
            if (isMounted && onError) onError(err);
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.warn('Turnstile render warning:', err);
      }
    }

    if (window.turnstile) {
      initTurnstile();
    } else {
      const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => initTurnstile();
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => initTurnstile(), { once: true });
      }
    }

    return () => {
      isMounted = false;

      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;

      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // ignore
        }
      }
    };
  }, [siteKey, onVerify, onExpire, onError]);

  return <div ref={containerRef} className={className} />;
}
