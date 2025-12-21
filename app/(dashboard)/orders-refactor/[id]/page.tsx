/**
 * Order Detail Page (Refactored)
 * Route: /orders-refactor/[id]
 */

import { Suspense } from 'react';
import OrderDetailContent from '@/components/orders-refactor/detail/OrderDetailContent';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
            <p className="text-sm text-[var(--muted-foreground)]">
              Loading order...
            </p>
          </div>
        </div>
      }
    >
      <OrderDetailContent orderId={id} />
    </Suspense>
  );
}
