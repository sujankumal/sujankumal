"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageLoader() {
  const pathname = usePathname();
  const [transient, setTransient] = useState(false);
  const [started, setStarted] = useState(false);

  // Briefly show loader on pathname change (for fast navigations)
  useEffect(() => {
    // when pathname changes we consider navigation complete; reset started
    setStarted(false);
    setTransient(true);
    const t = setTimeout(() => setTransient(false), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  // Detect navigation START as soon as history.pushState/replaceState/popstate occur
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only patch once
    const win = window as any;
    if (!win.__pageLoaderPatched) {
      win.__pageLoaderPatched = true;
      win.__origPushState = history.pushState;
      win.__origReplaceState = history.replaceState;

      history.pushState = function (...args: any[]) {
        const result = win.__origPushState.apply(this, args);
        window.dispatchEvent(new Event('app-route-change-start'));
        return result;
      };

      history.replaceState = function (...args: any[]) {
        const result = win.__origReplaceState.apply(this, args);
        window.dispatchEvent(new Event('app-route-change-start'));
        return result;
      };

      // popstate (back/forward) should also trigger start
      window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('app-route-change-start'));
      });
    }

    const onStart = () => {
      // schedule update asynchronously to avoid React warning about insertion effects
      setTimeout(() => setStarted(true), 0);
    };
    window.addEventListener('app-route-change-start', onStart);
    return () => {
      window.removeEventListener('app-route-change-start', onStart);
    };
  }, []);

  // Ensure loader auto-hides in case navigation doesn't update pathname
  useEffect(() => {
    if (!started) return;
    const MAX_MS = 15000; // 15s max
    const t = setTimeout(() => setStarted(false), MAX_MS);
    return () => clearTimeout(t);
  }, [started]);

  const loading = transient || started;
  if (!loading) return null;

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 24, display: 'flex', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.82)', color: '#fff', padding: '10px 14px', borderRadius: 999, boxShadow: '0 8px 28px rgba(0,0,0,0.28)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <g>
            <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
            </path>
          </g>
        </svg>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Loading…</div>
      </div>
    </div>
  );
}
