import { Suspense } from 'react';
import WarehouseReturnsContent from '@/components/warehouse/WarehouseReturnsContent';

export default function WarehouseReturnsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <WarehouseReturnsContent />
    </Suspense>
  );
}
