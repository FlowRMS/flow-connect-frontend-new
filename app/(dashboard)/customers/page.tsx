import { Suspense } from 'react';
import CustomersContent from '@/components/customers/CustomersContent';

function CustomersLoading() {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
          <div>
            <div className="h-7 w-32 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-4 w-48 bg-[var(--muted)] rounded mt-1 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-10 w-32 bg-[var(--muted)] rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-full bg-[var(--muted)] rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[var(--muted)] rounded-full animate-pulse" />
              <div>
                <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse" />
                <div className="h-3 w-16 bg-[var(--muted)] rounded mt-1 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-[var(--muted)] rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomersLoading />}>
      <CustomersContent />
    </Suspense>
  );
}
