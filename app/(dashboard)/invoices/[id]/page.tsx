'use client';

import { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import InvoiceDetailContent from '@/components/invoices/detail/InvoiceDetailContent';

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();

  // Get orderId from query params (used when creating new invoice from order)
  const orderId = searchParams.get('orderId') || undefined;

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <InvoiceDetailContent invoiceId={resolvedParams.id} initialOrderId={orderId} />
    </Suspense>
  );
}

