'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface FreePlanAdProps {
  slot: string;
  className?: string;
}

const adsenseClient = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT;

/**
 * Policy-conscious free-tier ad placement. It is deliberately isolated from
 * generation controls, editors, forms, dialogs, and checkout actions.
 */
export function FreePlanAd({ slot, className = '' }: FreePlanAdProps) {
  const requested = useRef(false);

  useEffect(() => {
    if (!adsenseClient || !slot || requested.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      requested.current = true;
    } catch (error) {
      console.warn('AdSense unit did not initialize', error);
    }
  }, [slot]);

  if (!adsenseClient || !slot) return null;

  return (
    <aside
      aria-label="Advertisement"
      className={`mx-auto mt-10 w-full max-w-5xl border-t border-white/5 pt-6 ${className}`}
    >
      <Script
        id="sitecraft-adsense"
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`}
      />
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-gray-600">
        Advertisement
      </p>
      <ins
        className="adsbygoogle block min-h-[90px] overflow-hidden rounded-xl"
        style={{ display: 'block' }}
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

