import { Suspense } from 'react';
import { StartClient } from './start-client';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Start your site — SiteCraft' };

/**
 * /start?signup=<id>&vertical=<slug>&business=<name>
 *
 * Landing target for the marketing welcome email. Resolves the signup row,
 * pre-fills the new-project flow with the right vertical + business name,
 * then routes the user into signup-or-login (with redirect back here on
 * return), so the create-project flow sees the prefilled state.
 */
export default function StartPage() {
  return (
    <Suspense fallback={null}>
      <StartClient />
    </Suspense>
  );
}
