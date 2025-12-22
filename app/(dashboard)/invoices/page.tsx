/**
 * Invoices Page
 * Route: /invoices
 *
 */

import { Suspense } from 'react';
import InvoicesListContent from '@/components/invoices/list/InvoicesListContent';

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <InvoicesListContent />
    </Suspense>
  );
}

