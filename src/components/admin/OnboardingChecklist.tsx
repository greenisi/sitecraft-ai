'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STEP_CONFIG: Record<string, { label: string; description: string; path: string }> = {
  'business-type': { label: 'Choose Business Type', description: 'Select your industry to customize the experience', path: '/setup' },
  'business-info': { label: 'Add Business Info', description: 'Name, description, contact details', path: '/setup' },
  'business-hours': { label: 'Set Business Hours', description: 'Let customers know when you are open', path: '/setup' },
  'first-service': { label: 'Create Your First Service', description: 'Add a service you offer to customers', path: '/services' },
  'first-product': { label: 'Add Your First Product', description: 'List a product for your store', path: '/products' },
  'gallery': { label: 'Upload Gallery Images', description: 'Showcase your work with photos', path: '/gallery' },
  'blog': { label: 'Write Your First Post', description: 'Start blogging to attract visitors', path: '/blog' },
  'stripe': { label: 'Connect Payments', description: 'Accept payments via Stripe', path: '/setup' },
};

interface ApiResponse { steps: Record<string, boolean>; completed: number; total: number; businessType: string | null; }
interface Step { id: string; label: string; description: string; href: string; completed: boolean; }

export default function OnboardingChecklist({ projectId }: { projectId: string }) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const key = `onboarding_dismissed_${projectId}`;
    if (localStorage.getItem(key) === 'true') setDismissed(true);
    fetch(`/api/projects/${projectId}/onboarding-status`)
      .then(r => r.ok ? r.json() : null)
      .then((d: ApiResponse | null) => {
        if (!d) return;
        const base = `/projects/${projectId}/admin`;
        const mapped: Step[] = Object.entries(d.steps).map(([id, done]) => {
          const cfg = STEP_CONFIG[id] || { label: id, description: '', path: '/setup' };
          return { id, label: cfg.label, description: cfg.description, href: `${base}${cfg.path}`, completed: done };
        });
        setSteps(mapped);
        setCompletedCount(d.completed);
        setTotalCount(d.total);
        setTimeout(() => setLoaded(true), 100);
      }).catch(() => {});
  }, [projectId]);

  const dismiss = () => { localStorage.setItem(`onboarding_dismissed_${projectId}`, 'true'); setDismissed(true); };
  const restore = () => { localStorage.removeItem(`onboarding_dismissed_${projectId}`); setDismissed(false); };

  if (steps.length === 0) return null;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (circumference * pct) / 100;

  if (dismissed) {
    return (<button onClick={restore} className="text-sm text-purple-400 hover:text-purple-300 transition-colors mb-2">Show setup guide</button>);
  }

  const stylesArr = [
    '@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }',
    '@keyframes checkBounce { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }',
    `@keyframes ringFill { from { stroke-dashoffset: ${circumference}; } }`,
    '@keyframes borderGlow { 0%, 100% { border-color: rgba(147,51,234,0.3); } 50% { border-color: rgba(147,51,234,0.6); } }',
    '@keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(-60px) rotate(360deg); opacity: 0; } }',
    '.step-row { animation: fadeInUp 0.4s ease both; }',
    '.check-done { animation: checkBounce 0.4s ease both; }',
    '.ring-animated { animation: ringFill 1s ease both; }',
    '.glow-border { animation: borderGlow 3s ease-in-out infinite; }',
    '.confetti-dot { position: absolute; width: 6px; height: 6px; border-radius: 50%; animation: confetti 1.5s ease-out both; }',
  ].join(' ');
  const colors = ['#a855f7','#3b82f6','#22c55e','#eab308','#ef4444','#06b6d4'];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: stylesArr }} />
      <div className="glow-border bg-gray-900/80 backdrop-blur border border-gray-800 rounded-xl p-6 relative overflow-hidden">
        {allDone && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="confetti-dot" style={{ left: `${10 + Math.random() * 80}%`, top: `${20 + Math.random() * 60}%`, backgroundColor: colors[i % 6], animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#1f2937" strokeWidth="6" />
              <circle cx="48" cy="48" r="40" fill="none" stroke={allDone ? '#22c55e' : '#9333ea'} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={loaded ? dashOffset : circumference} className="ring-animated" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{pct}%</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{allDone ? '\u{1F389} You are all set!' : 'Getting Started'}</h2>
            <p className="text-sm text-gray-400 mt-1">{allDone ? 'Your business is fully configured and ready to go!' : `Complete these steps \u2022 ${completedCount} of ${totalCount} done`}</p>
          </div>
        </div>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={step.id} className="step-row flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${step.completed ? 'bg-green-500 border-green-500 check-done' : 'border-gray-600 group-hover:border-purple-500'}`} style={step.completed ? { animationDelay: `${0.3 + i * 0.07}s` } : {}}>
                {step.completed && (<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>)}
              </div>
              <div className={`flex-1 min-w-0 ${step.completed ? 'opacity-60' : ''}`}>
                <p className={`text-sm font-medium ${step.completed ? 'line-through text-gray-400' : 'text-white'}`}>{step.label}</p>
                <p className="text-xs text-gray-500 truncate">{step.description}</p>
              </div>
              {!step.completed && (<Link href={step.href} className="flex-shrink-0 text-xs px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors">Go →</Link>)}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800">
          <button onClick={dismiss} className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Dismiss checklist</button>
        </div>
      </div>
    </>
  );
}
