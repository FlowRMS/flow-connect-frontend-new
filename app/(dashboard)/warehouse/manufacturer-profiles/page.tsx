import { Suspense } from 'react';
import ManufacturerProfilesContent from '@/components/warehouse/ManufacturerProfilesContent';

export default function ManufacturerProfilesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <ManufacturerProfilesContent />
    </Suspense>
  );
}
