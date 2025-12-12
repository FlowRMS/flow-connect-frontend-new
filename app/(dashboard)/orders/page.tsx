import { Suspense } from 'react';
import OrdersContent from '@/components/orders/OrdersContent';

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <OrdersContent />
    </Suspense>
  );
}
