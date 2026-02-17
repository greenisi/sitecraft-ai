'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Signup failed');
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 shadow-xl shadow-black/5 animate-fade-in-up">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground mt-1">Get started with SiteCraft AI</p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive animate-scale-in">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-xs font-medium">Name</Label>
            <Input
              id="display-name"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
              autoComplete="name"
              autoFocus
              className="h-11 rounded-xl border-border/50 focus:border-primary/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              className="h-11 rounded-xl border-border/50 focus:border-primary/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
              className="h-11 rounded-xl border-border/50 focus:border-primary/30"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-violet-500/20 transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-violet-600 dark:text-violet-400 hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
