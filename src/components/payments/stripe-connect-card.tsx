'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Check, AlertCircle, ExternalLink, Settings, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type StatusResp = {
  mode: 'project' | 'user' | 'none';
  accountId: string | null;
  chargesEnabled: boolean;
  onboardingComplete: boolean;
  dashboardUrl: string | null;
  configured?: boolean;
  error?: string;
  code?: string;
  userDefault: { connected: boolean; accountId: string; chargesEnabled: boolean; onboardingComplete: boolean } | null;
};

/**
 * Card shows one of three states:
 *   mode='none'    → "Connect Stripe" button (defaults to user-level)
 *   mode='user'    → "Using your default Stripe" + option to use a different one for this site
 *   mode='project' → "This site has its own Stripe" + option to switch back to default
 */
export function StripeConnectCard({ projectId }: { projectId: string }) {
  const params = useSearchParams();
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [busy, setBusy] = useState<'load' | 'start' | 'start-project' | 'reset' | null>('load');
  const [showSwitchOptions, setShowSwitchOptions] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stripe/status`);
      if (!res.ok) {
        setStatus({ mode: 'none', accountId: null, chargesEnabled: false, onboardingComplete: false, dashboardUrl: null, userDefault: null });
        return;
      }
      setStatus(await res.json());
    } finally {
      setBusy(null);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const code = params.get('stripe');
    if (!code) return;
    if (code === 'success') toast.success('Stripe onboarding done — checking status…');
    else if (code === 'refresh') toast.info('Continue your Stripe onboarding.');
    else if (code === 'not_connected') toast.info('Connect Stripe before opening its dashboard.');
    else if (code === 'error') {
      const reason = params.get('reason');
      toast.error(
        reason === 'connect_not_configured'
          ? 'Stripe Connect is not available yet'
          : 'Stripe could not complete that request',
      );
    }
  }, [params]);

  async function connectUserDefault() {
    setBusy('start');
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' });
      const j = await res.json();
      if (!res.ok || !j.url) { toast.error(j.error || 'Could not start Stripe onboarding'); return; }
      window.location.href = j.url;
    } finally { setBusy(null); }
  }

  async function connectProjectAccount() {
    setBusy('start-project');
    try {
      const res = await fetch(`/api/projects/${projectId}/stripe/onboard`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok || !j.url) { toast.error(j.error || 'Could not start onboarding'); return; }
      window.location.href = j.url;
    } finally { setBusy(null); }
  }

  async function useDefault() {
    if (!confirm('Switch this site back to your default Stripe? Future payments on this site will land in your default Stripe account.')) return;
    setBusy('reset');
    try {
      const res = await fetch(`/api/projects/${projectId}/stripe/use-default`, { method: 'POST' });
      if (!res.ok) { toast.error('Could not switch'); return; }
      toast.success('Switched back to your default Stripe.');
      setShowSwitchOptions(false);
      await load();
    } finally { setBusy(null); }
  }

  if (busy === 'load' || status === null) {
    return <Skeleton text="Loading payment connection…" />;
  }

  if (status.configured === false) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold">Stripe Connect is temporarily unavailable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The platform owner needs to finish Stripe Connect setup. Your project and any existing Stripe account were not changed.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (status.code === 'connect_account_unavailable') {
    const reconnectProject = status.mode === 'project';
    return (
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold">Reconnect Stripe</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The saved connection is no longer available to this platform. Reconnecting creates a fresh link without deleting the previous Stripe account.
            </p>
          </div>
        </div>
        <button
          onClick={reconnectProject ? connectProjectAccount : connectUserDefault}
          disabled={busy === 'start' || busy === 'start-project'}
          className="inline-flex items-center gap-2 rounded-full bg-[#635bff] hover:bg-[#5851e0] text-white font-medium px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {(busy === 'start' || busy === 'start-project')
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><Wordmark /> Reconnect with Stripe</>}
        </button>
      </Card>
    );
  }

  // STATE 1 — nothing connected anywhere.
  if (status.mode === 'none') {
    return (
      <Card>
        <header>
          <h3 className="text-base font-semibold">Accept payments on your site</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your Stripe account. Money from your store goes straight to your bank — we never hold it.
            One-time setup, about 3 minutes.
          </p>
        </header>
        <Bullets items={[
          'You keep 100% of each sale (minus Stripe\'s standard fee)',
          'Refunds, disputes, payouts — handled in your own Stripe Express dashboard',
          'One Stripe account works across all your generated sites by default',
        ]} />
        <button
          onClick={connectUserDefault}
          disabled={busy === 'start'}
          className="inline-flex items-center gap-2 rounded-full bg-[#635bff] hover:bg-[#5851e0] text-white font-medium px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {busy === 'start' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Wordmark /> Connect with Stripe</>}
        </button>
      </Card>
    );
  }

  // STATE 2 — using user default.
  if (status.mode === 'user') {
    return (
      <Card>
        <ConnectedHeader status={status} subtitle="This site uses your default Stripe (shared across all your sites)." />
        {!status.onboardingComplete && (
          <FinishOnboarding onClick={connectUserDefault} busy={busy === 'start'} />
        )}

        {!showSwitchOptions ? (
          <button
            onClick={() => setShowSwitchOptions(true)}
            className="inline-flex items-center gap-2 rounded-full border bg-background hover:bg-muted text-foreground font-medium px-4 py-2 text-xs"
          >
            <Settings className="h-3 w-3" /> Use a different Stripe for this site
          </button>
        ) : (
          <div className="rounded-xl border border-dashed p-4 space-y-3">
            <div className="text-sm">
              <div className="font-medium">Connect a separate Stripe account just for this site</div>
              <p className="text-xs text-muted-foreground mt-1">
                Useful if this site is a separate business with its own bank account. Payments from this site only will land in the new account.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={connectProjectAccount}
                disabled={busy === 'start-project'}
                className="inline-flex items-center gap-2 rounded-full bg-[#635bff] hover:bg-[#5851e0] text-white font-medium px-4 py-2 text-xs disabled:opacity-60"
              >
                {busy === 'start-project' ? <Loader2 className="h-3 w-3 animate-spin" /> : <>Connect a separate Stripe</>}
              </button>
              <button
                onClick={() => setShowSwitchOptions(false)}
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  // STATE 3 — this site has its own override.
  return (
    <Card>
      <ConnectedHeader status={status} subtitle="This site has its own Stripe account (separate from your default)." badgeColor="indigo" />
      {!status.onboardingComplete && (
        <FinishOnboarding onClick={connectProjectAccount} busy={busy === 'start-project'} />
      )}
      <button
        onClick={useDefault}
        disabled={busy === 'reset'}
        className="inline-flex items-center gap-2 rounded-full border bg-background hover:bg-muted text-foreground font-medium px-4 py-2 text-xs disabled:opacity-60"
      >
        {busy === 'reset' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowLeft className="h-3 w-3" />}
        {status.userDefault?.connected ? 'Switch back to my default Stripe' : 'Disconnect this Stripe'}
      </button>
    </Card>
  );
}

// ───── presentational helpers ──────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-card p-6 space-y-4">{children}</div>;
}

function Skeleton({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> {text}
      </div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="text-xs text-muted-foreground space-y-1.5">
      {items.map((it) => (
        <li key={it} className="flex items-start gap-2">
          <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5" /> {it}
        </li>
      ))}
    </ul>
  );
}

function ConnectedHeader({
  status, subtitle, badgeColor = 'emerald',
}: { status: StatusResp; subtitle: string; badgeColor?: 'emerald' | 'indigo' }) {
  const enabled = status.chargesEnabled;
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Stripe connected</h3>
          {enabled ? (
            <span className={
              'inline-flex items-center gap-1 rounded-full text-[11px] px-2 py-0.5 ' +
              (badgeColor === 'indigo'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400')
            }>
              <Check className="h-3 w-3" /> Ready to accept payments
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] px-2 py-0.5">
              <AlertCircle className="h-3 w-3" /> Finish onboarding
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {subtitle}{' '}
          <code className="font-mono">{maskAccountId(status.accountId ?? '')}</code>
        </p>
      </div>
      {status.dashboardUrl && (
        <a
          href={status.dashboardUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Open Stripe <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function FinishOnboarding({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Stripe still needs a few more details from you before real customers can pay.</span>
      </div>
      <button
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-[#635bff] hover:bg-[#5851e0] text-white font-medium px-4 py-2 text-xs disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Continue onboarding'}
      </button>
    </div>
  );
}

function maskAccountId(id: string) {
  if (id.length <= 12) return id;
  return id.slice(0, 8) + '…' + id.slice(-4);
}

function Wordmark() {
  return <span className="font-semibold tracking-tight italic">stripe</span>;
}
