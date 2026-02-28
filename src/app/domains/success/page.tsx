'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, Globe, ArrowRight } from 'lucide-react';

function DomainSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'fulfilling' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [domain, setDomain] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const domainParam = searchParams.get('domain');

    if (domainParam) setDomain(domainParam);

    if (!sessionId) {
      setStatus('error');
      setMessage('Invalid checkout session. Please try again.');
      return;
    }

    fulfillPurchase(sessionId);
  }, [searchParams]);

  async function fulfillPurchase(sessionId: string) {
    try {
      setStatus('fulfilling');
      setMessage('Payment confirmed! Registering your domain...');

      const res = await fetch('/api/domains/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setDomain(data.data?.domain || domain);
        setMessage('Domain registered successfully!');
      } else {
        // If domain was already fulfilled (by webhook), still show success
        if (data.error?.code === 'ALREADY_FULFILLED') {
          setStatus('success');
          setMessage('Domain is already registered!');
        } else {
          setStatus('error');
          setMessage(data.error?.message || 'Failed to complete domain registration.');
        }
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Your payment was received — the domain will be registered shortly.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          {status === 'loading' || status === 'fulfilling' ? (
            <>
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Processing Your Domain</h1>
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
              <h1 className="text-2xl font-bold mb-3">Domain Purchased!</h1>
              <p className="text-gray-400 mb-4">{message}</p>
              {domain && (
                <div className="mb-6 px-4 py-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <Globe className="w-5 h-5 text-green-400" />
                    <span className="text-lg font-mono text-green-400">{domain}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">DNS propagation typically takes 5-30 minutes</p>
                </div>
              )}
              <button
                onClick={() => router.push('/domains')}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Go to My Domains
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Something Went Wrong</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/domains')}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                >
                  Return to Domains
                </button>
                <button
                  onClick={() => router.push('/issues')}
                  className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors text-gray-300"
                >
                  Report an Issue
                </button>
              </div>
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
