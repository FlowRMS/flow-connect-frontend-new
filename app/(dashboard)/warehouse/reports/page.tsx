import { Suspense } from 'react';
import WarehouseReportsContent from '@/components/warehouse/WarehouseReportsContent';

export default function WarehouseReportsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <WarehouseReportsContent />
    </Suspense>
  );
}
