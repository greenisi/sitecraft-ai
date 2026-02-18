'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      duration={5000}
      toastOptions={{
        classNames: {
          toast: 'bg-background text-foreground border-border shadow-lg',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}
