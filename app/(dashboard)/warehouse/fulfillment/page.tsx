import { Suspense } from 'react';
import WarehouseFulfillmentContent from '@/components/warehouse/WarehouseFulfillmentContent';

export default function WarehouseFulfillmentPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <WarehouseFulfillmentContent />
    </Suspense>
  );
}
