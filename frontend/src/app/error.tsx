'use client';

import { useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">Something went wrong!</h2>
          <p className="text-muted-foreground">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          {process.env.NEXT_PUBLIC_ENV === 'development' && error.message && (
            <div className="mt-4 p-4 bg-muted rounded-lg text-left">
              <p className="text-xs font-mono text-red-600">{error.message}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button className={buttonVariants({ variant: 'outline' })} onClick={() => reset()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
          <Link href="/" className={buttonVariants()}>
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </div>
      </Card>
    </div>
  );
}

