'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createRecoveryClient } from '@/lib/supabase/recovery-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryClient] = useState(createRecoveryClient);

  useEffect(() => {
    // Parse the self-contained recovery token from the URL fragment when the
    // email is opened in Safari or another browser outside the app.
    recoveryClient.auth.initialize().then(async ({ error: initializationError }) => {
      if (initializationError) {
        setError(initializationError.message);
        setReady(false);
        setChecking(false);
        return;
      }

      const { data } = await recoveryClient.auth.getSession();
      setReady(Boolean(data.session));
      setChecking(false);
    });
  }, [recoveryClient]);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await recoveryClient.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    const { data: recoverySession } = await recoveryClient.auth.getSession();
    if (recoverySession.session) {
      await createClient().auth.setSession({
        access_token: recoverySession.session.access_token,
        refresh_token: recoverySession.session.refresh_token,
      });
    }
    setComplete(true);
  }

  if (checking) {
    return <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-violet-400" /></div>;
  }

  if (complete) {
    return (
      <div className="py-3 text-center">
        <CheckCircle className="mx-auto h-11 w-11 text-emerald-400" />
        <h1 className="mt-4 text-xl font-bold">Password updated</h1>
        <p className="mt-2 text-sm text-muted-foreground">You can now use your new password in the Sitecraft app.</p>
        <Link href="/dashboard"><Button className="mt-6 h-11 w-full rounded-xl">Continue to Sitecraft</Button></Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="py-3 text-center">
        <h1 className="text-xl font-bold">Reset link expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">Request a new link and open the newest email.</p>
        <Link href="/forgot-password"><Button className="mt-6 h-11 w-full rounded-xl">Send a new reset link</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">This password will work in both the app and website.</p>
      </div>
      {error && <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={updatePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-xs font-medium">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="h-11 rounded-xl pl-10 pr-11" autoFocus />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-xs font-medium">Confirm password</Label>
          <Input id="confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className="h-11 rounded-xl" />
        </div>
        <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
