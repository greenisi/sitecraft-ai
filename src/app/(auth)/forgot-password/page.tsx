'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

      if (!email.trim()) {
              setError('Please enter your email address.');
              return;
      }

      setIsLoading(true);
        try {
                const supabase = createClient();
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                          email.trim(),
                  { redirectTo: `${window.location.origin}/callback?next=/settings` }
                        );

          if (resetError) {
                    setError(resetError.message);
                    return;
          }

          setSent(true);
        } catch {
                setError('An unexpected error occurred. Please try again.');
        } finally {
                setIsLoading(false);
        }
  }

  return (
        <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-black/5 card-alive">
              <div className="text-center mb-6">
                      <h1 className="text-xl font-bold tracking-tight">Reset your password</h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        {sent
                                      ? 'Check your email for a reset link'
                                      : "Enter your email and we'll send you a reset link"}
                      </p>
              </div>
        
          {sent ? (
                  <div className="space-y-4">
                            <div className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                        If an account exists for {email}, you will receive a password reset email shortly.
                            </div>
                            <Link href="/login">
                                        <Button
                                                        variant="outline"
                                                        className="w-full h-11 rounded-xl border-border/50"
                                                      >
                                                      <ArrowLeft className="mr-2 h-4 w-4" />
                                                      Back to sign in
                                        </Button>
                            </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {error && (
                                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive animate-scale-in">
                                  {error}
                                </div>
                            )}
                  
                            <form onSubmit={handleReset} className="space-y-4">
                                        <div className="space-y-2">
                                                      <Label htmlFor="email" className="text-xs font-medium">
                                                                      Email
                                                      </Label>
                                                      <div className="relative input-alive">
                                                                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                                                                      <Input
                                                                                          id="email"
                                                                                          type="email"
                                                                                          placeholder="you@example.com"
                                                                                          value={email}
                                                                                          onChange={(e) => setEmail(e.target.value)}
                                                                                          disabled={isLoading}
                                                                                          autoComplete="email"
                                                                                          autoFocus
                                                                                          className="h-11 pl-10 rounded-xl border-border/50 focus:border-foreground/20 transition-all duration-300 focus:shadow-[0_0_0_3px_hsla(var(--foreground),0.05)]"
                                                                                        />
                                                      </div>
                                        </div>
                            
                                        <Button
                                                        type="submit"
                                                        className="w-full h-11 rounded-xl bg-foreground hover:bg-foreground/90 text-background border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-foreground/10 hover:-translate-y-0.5 active:translate-y-0"
                                                        disabled={isLoading}
                                                      >
                                          {isLoading ? (
                                                                        <>
                                                                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                                          Sending...
                                                                        </>
                                                                      ) : (
                                                                        'Send reset link'
                                                                      )}
                                        </Button>
                            </form>
                  
                            <div className="text-center">
                                        <Link
                                                        href="/login"
                                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 inline-flex items-center gap-1"
                                                      >
                                                      <ArrowLeft className="h-3 w-3" />
                                                      Back to sign in
                                        </Link>
                            </div>
                  </div>
              )}
        </div>
      );
}
