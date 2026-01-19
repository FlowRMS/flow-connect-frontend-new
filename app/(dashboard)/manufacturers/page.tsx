import { Suspense } from 'react';
import ManufacturerProfilesContent from '@/components/warehouse/ManufacturerProfilesContent';

function ManufacturersLoading() {
  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Manufacturers</h1>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span>Loading manufacturers...</span>
        </div>
      </div>
    </div>
  );
}

export default function ManufacturersPage() {
  return (
    <Suspense fallback={<ManufacturersLoading />}>
      <ManufacturerProfilesContent basePath="/manufacturers" />
    </Suspense>
  );
}
