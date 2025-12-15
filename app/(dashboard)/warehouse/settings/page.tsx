import { Suspense } from 'react';
import WarehouseSettingsContent from '@/components/warehouse/WarehouseSettingsContent';

export default function WarehouseSettingsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <WarehouseSettingsContent />
    </Suspense>
  );
}
