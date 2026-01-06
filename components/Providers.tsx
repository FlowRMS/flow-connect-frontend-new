'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        expand={false}
        closeButton
        toastOptions={{
          duration: 4000,
        }}
        theme="light"
      />
      {/* Portal containers for date pickers and dropdowns */}
      <div id="datepicker-portal" />
      <div id="dropdown-portal" />
    </QueryClientProvider>
  );
}
