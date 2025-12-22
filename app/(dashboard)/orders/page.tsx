/**
 * Orders Refactor Testing Page
 * Route: /orders-refactor
 *
 * This is a testing route to view the refactored orders list
 * while keeping the original /orders route intact
 */

import { Suspense } from 'react';
import OrdersListContent from '@/components/orders/list/OrdersListContent';

export default function OrdersRefactorPage() {
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
