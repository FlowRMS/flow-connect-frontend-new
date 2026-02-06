'use client';

import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e5e7eb',
          },
          duration: 4000,
        }}
      />
    </>
  );
}
