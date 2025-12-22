'use client';

import { use, Suspense } from 'react';
import InvoiceDetailContent from '@/components/invoices-refactor/detail/InvoiceDetailContent';

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <InvoiceDetailContent invoiceId={resolvedParams.id} />
    </Suspense>
  );
}

