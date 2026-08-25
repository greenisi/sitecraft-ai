'use client';

import { Toaster } from 'sonner';

/**
 * Toasts render dark and drop from the top.
 *
 * Sonner defaults to its light theme, so on the dark app a toast arrived as
 * a white slab. Bottom placement also sat it directly on top of the mobile
 * tab bar. iOS banners come down from the top, so these do too.
 */
export function ToastProvider() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      duration={5000}
      // Clears the navigation bar, so a toast never covers the screen
      // title. Sonner applies a separate offset below 600px wide, and
      // setting only the first one left phones with the default.
      offset="calc(env(safe-area-inset-top) + 58px)"
      mobileOffset="calc(env(safe-area-inset-top) + 60px)"
      toastOptions={{
        classNames: {
          toast:
            'bg-[color:var(--surface-2,#1b1b20)] text-[color:var(--label,#f5f5f7)] border-[color:var(--hairline-strong,rgba(255,255,255,.13))] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,.5)]',
          description: 'text-[color:var(--label-2,rgba(235,235,245,.6))]',
        },
      }}
    />
  );
}
