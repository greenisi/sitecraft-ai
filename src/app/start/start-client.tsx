'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, Check } from 'lucide-react';

const VERTICAL_LABELS: Record<string, string> = {
  'pressure-washing': 'pressure washing',
  'lawn-care':        'lawn care',
  'junk-removal':     'junk removal',
  'painting':         'painting',
  'hvac':             'HVAC',
  'roofing':          'roofing',
  'plumbing':         'plumbing',
  'electrical':       'electrical',
  'landscaping':      'landscaping',
  'general':          'home service',
};

/**
 * Lightweight "warm up" page. Stores the prefill payload in sessionStorage,
 * then routes the user to login (if signed out) or directly to the new-
 * project flow (if signed in). The new-project flow reads the same
 * sessionStorage key to prefill industry + business name.
 */
export function StartClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [verticalLabel, setVerticalLabel] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    const vertical = (params.get('vertical') || '').toLowerCase();
    const business = params.get('business') || '';
    const signupId = params.get('signup') || '';

    if (!vertical) {
      router.replace('/');
      return;
    }

    const label = VERTICAL_LABELS[vertical] ?? vertical;
    setVerticalLabel(label);
    setBusinessName(business || null);

    // Stash payload so the new-project flow can read it after auth.
    try {
      sessionStorage.setItem(
        'sitecraft.start_prefill',
        JSON.stringify({
          vertical,
          verticalLabel: label,
          businessName: business || null,
          signupId,
          stampedAt: Date.now(),
        })
      );
    } catch {
      // sessionStorage disabled (private mode etc) — fall back to query params on the redirect
    }

    // Brief delay so user sees the "got it, sending you in" message.
    const t = setTimeout(() => {
      const next = '/projects/new?vertical=' + encodeURIComponent(vertical)
        + (business ? '&business=' + encodeURIComponent(business) : '');
      router.replace('/login?next=' + encodeURIComponent(next));
    }, 1200);
    return () => clearTimeout(t);
  }, [params, router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-semibold mb-3">
          Got it{businessName ? `, ${businessName}` : ''}.
        </h1>
        <p className="text-gray-300 mb-2">
          Pulling up your {verticalLabel ?? 'site'} starter…
        </p>
        <div className="inline-flex items-center gap-2 text-gray-500 text-sm mt-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading the builder
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
