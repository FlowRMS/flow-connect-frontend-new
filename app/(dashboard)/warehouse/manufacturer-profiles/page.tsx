import { Suspense } from 'react';
import ManufacturerProfilesContent from '@/components/warehouse/ManufacturerProfilesContent';

export default function ManufacturerProfilesPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
        <ManufacturerProfilesContent />
      </Suspense>
    </main>
  );
}
