'use client';

import { Toaster } from '@/components/ui/sonner';

/**
 * Toast notification provider using Sonner
 * - Client-side only
 * - Shows toast notifications for user feedback
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: 'white',
          color: '#333',
          border: '1px solid #e5e5e5',
        },
        className: 'toast',
      }}
      closeButton
      richColors
    />
  );
}

