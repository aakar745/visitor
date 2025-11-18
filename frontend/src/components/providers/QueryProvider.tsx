'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

/**
 * React Query Provider
 * - Client-side only provider for data fetching
 * - Configures caching, retries, and stale time
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.statusCode >= 400 && error?.statusCode < 500) {
                return false;
              }
              // Retry up to 2 times for 5xx or network errors
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
          mutations: {
            retry: false, // Don't retry mutations
            onError: (error: any) => {
              console.error('[Mutation Error]', error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NEXT_PUBLIC_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}

