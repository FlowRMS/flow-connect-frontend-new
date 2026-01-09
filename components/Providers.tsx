'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { UnauthorizedProvider, useUnauthorized, setGlobalUnauthorizedTrigger } from '@/components/lib/unauthorized-handler';

// Inner component to set up the global trigger
function UnauthorizedTriggerSetup({ children }: { children: React.ReactNode }) {
  const { triggerUnauthorized } = useUnauthorized();

  useEffect(() => {
    setGlobalUnauthorizedTrigger(triggerUnauthorized);
  }, [triggerUnauthorized]);

  return <>{children}</>;
}

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
      <UnauthorizedProvider>
        <UnauthorizedTriggerSetup>
          {children}
        </UnauthorizedTriggerSetup>
      </UnauthorizedProvider>
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          duration: 4000,
        }}
      />
      {/* Portal containers for date pickers and dropdowns */}
      <div id="datepicker-portal" />
      <div id="dropdown-portal" />
    </QueryClientProvider>
  );
}
