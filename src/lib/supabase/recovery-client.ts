import { createClient } from '@supabase/supabase-js';

// Password-reset emails are often requested in the app and opened in Gmail or
// Safari. The regular SSR browser client always forces PKCE, whose verifier is
// stored only in the browser that requested the email. An implicit recovery
// link carries the short-lived session in the link instead, so it works across
// apps and devices.
export function createRecoveryClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
      },
    }
  );
}
