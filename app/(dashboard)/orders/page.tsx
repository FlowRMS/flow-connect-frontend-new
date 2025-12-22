/**
 * Orders Page
 * Route: /orders
 *
 */

import { Suspense } from 'react';
import OrdersListContent from '@/components/orders/list/OrdersListContent';

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <OrdersListContent />
    </Suspense>
  );
}
