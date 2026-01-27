import { Suspense } from 'react';
import WarehouseDeliveriesContent from '@/components/warehouse/deliveries/list/WarehouseDeliveriesContent';

export default function WarehouseDeliveriesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <WarehouseDeliveriesContent />
    </Suspense>
  );
}
