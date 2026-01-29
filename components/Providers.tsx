'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '@/lib/analytics/apolloClient';
import { useState, useEffect, createContext, useContext } from 'react';
import { Toaster } from 'sonner';
import { UnauthorizedProvider, useUnauthorized, setGlobalUnauthorizedTrigger } from '@/components/lib/unauthorized-handler';

// Color inversion context
const InvertContext = createContext<{
  inverted: boolean;
  toggle: () => void;
  setInverted: (value: boolean) => void;
}>({
  inverted: false,
  toggle: () => {},
  setInverted: () => {},
});
export const useInvert = () => useContext(InvertContext);

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

  const [inverted, setInverted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('color-inverted');
    if (saved === 'true') setInverted(true);
  }, []);

  useEffect(() => {
    // Add smooth transition for the filter change
    document.documentElement.style.transition = 'filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    document.documentElement.style.filter = inverted ? 'invert(1) hue-rotate(180deg)' : '';
    localStorage.setItem('color-inverted', String(inverted));
  }, [inverted]);

  const toggle = () => setInverted(prev => !prev);

  return (
    <InvertContext.Provider value={{ inverted, toggle, setInverted }}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={client}>
          <UnauthorizedProvider>
            <UnauthorizedTriggerSetup>
              {children}
            </UnauthorizedTriggerSetup>
          </UnauthorizedProvider>
        </ApolloProvider>
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
    </InvertContext.Provider>
  );
}
