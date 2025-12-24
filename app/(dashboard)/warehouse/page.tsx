import { Suspense } from 'react';
import WarehouseOverviewContent from '@/components/warehouse/WarehouseOverviewContent';

export default function WarehousePage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <WarehouseOverviewContent />
    </Suspense>
  );
}
