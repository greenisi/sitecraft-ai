'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, Globe, ArrowRight } from 'lucide-react';

/**
 * After Stripe checkout, the user lands here. The Stripe WEBHOOK is what
 * actually registers the domain — this page just polls until the DB row
 * exists, then shows success. Never makes its own purchase call.
 */
function DomainSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'fulfilling' | 'success' | 'error'>('fulfilling');
  const [message, setMessage] = useState('Payment confirmed. Registering your domain…');
  const domain = searchParams.get('domain') || '';

  useEffect(() => {
    if (!domain) {
      setStatus('error');
      setMessage('Missing domain in checkout URL.');
      return;
    }
    let cancelled = false;
    let elapsed = 0;
    const POLL = 2000;
    const TIMEOUT = 45_000;

    async function tick() {
      if (cancelled) return;
      try {
        const r = await fetch('/api/domains');
        const j = await r.json();
        const found = (j.domains || []).find((d: { domain: string }) => d.domain === domain);
        if (found) {
          setStatus('success');
          setMessage('Domain registered. DNS may take 5–30 minutes to propagate worldwide.');
          return;
        }
      } catch {
        // network blip — keep polling
      }
      elapsed += POLL;
      if (elapsed >= TIMEOUT) {
        // Webhook should fire within seconds — anything longer is a real issue.
        setStatus('error');
        setMessage(
          'Your payment was received but registration is taking longer than usual. ' +
          'Refresh in a minute, or contact support if it persists.'
        );
        return;
      }
      setTimeout(tick, POLL);
    }
    tick();
    return () => { cancelled = true; };
  }, [domain]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          {status === 'fulfilling' ? (
            <>
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Processing your domain</h1>
              <p className="text-gray-400">{message}</p>
              {domain && (
                <div className="mt-4 px-4 py-2 bg-gray-800 rounded-lg inline-block">
                  <span className="text-purple-400 font-mono">{domain}</span>
                </div>
              )}
            </>
          ) : status === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Domain purchased</h1>
              <p className="text-gray-400 mb-4">{message}</p>
              {domain && (
                <div className="mb-6 px-4 py-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <Globe className="w-5 h-5 text-green-400" />
                    <span className="text-lg font-mono text-green-400">{domain}</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => router.push('/domains')}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Go to my domains
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Still processing</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => router.push('/domains')}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                Go to my domains
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DomainSuccessPage() {
  return (
    <Suspense>
      <DomainSuccessPageContent />
    </Suspense>
  );
}
