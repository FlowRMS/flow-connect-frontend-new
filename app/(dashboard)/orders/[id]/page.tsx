'use client';

import { use, Suspense } from 'react';
import OrderDetailContent from '@/components/orders/OrderDetailContent';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <OrderDetailContent orderId={resolvedParams.id} />
    </Suspense>
  );
}
