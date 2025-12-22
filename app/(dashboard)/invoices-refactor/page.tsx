/**
 * Invoices Refactor Testing Page
 * Route: /invoices-refactor
 *
 * This is a testing route to view the refactored invoices list
 * while keeping the original /invoices route intact
 */

import { Suspense } from 'react';
import InvoicesListContent from '@/components/invoices-refactor/list/InvoicesListContent';

export default function InvoicesRefactorPage() {
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

