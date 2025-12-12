import { Suspense } from 'react';
import WarehouseLayoutContent from '@/components/warehouse/WarehouseLayoutContent';

export default function WarehouseLayoutPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <WarehouseLayoutContent />
    </Suspense>
  );
}
