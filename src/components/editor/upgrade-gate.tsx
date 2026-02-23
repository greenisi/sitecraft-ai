'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Sparkles, X } from 'lucide-react';

/**
 * UpgradeModal — small popup telling free users to upgrade.
 * Shown when they click any AI-gated feature.
 */
function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-scale-in"
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(139,92,246,0.3)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Pro Feature</h3>
            <p className="text-xs text-gray-400">Upgrade to unlock</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-5 leading-relaxed">
          AI website generation is available on paid plans. Upgrade to Pro to
          build, customize, and publish unlimited websites with AI.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 transition-colors hover:text-white"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              onClose();
              router.push('/pricing');
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <Sparkles className="h-4 w-4" />
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * useUpgradeGate — hook that returns the modal element and a trigger function.
 * Call `showUpgrade()` to open the modal from any handler.
 */
export function useUpgradeGate() {
  const [open, setOpen] = useState(false);

  const modal = <UpgradeModal open={open} onClose={() => setOpen(false)} />;
  const showUpgrade = () => setOpen(true);

  return { modal, showUpgrade };
}

/**
 * LockBadge — tiny lock icon shown on gated UI elements.
 */
export function LockBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gray-500/20 ${className || 'h-4 w-4'}`}
    >
      <Lock className="h-2.5 w-2.5 text-gray-400" />
    </span>
  );
              }
