'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children into document.body, escaping any parent stacking context.
 * The dashboard layout wraps page content in `<main className="relative z-10">`,
 * which traps `fixed z-50` modals below the `z-20` navbar. Portaling to body
 * lifts overlays above everything regardless of where they're declared.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
