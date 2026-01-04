import { Suspense } from 'react';
import FilesContent from '@/components/files/FilesContent';

function FilesLoading() {
  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header skeleton */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="px-6 py-3">
          <div className="h-5 w-32 bg-[var(--muted)] rounded animate-pulse" />
        </div>
        <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 bg-[var(--muted)] rounded-lg animate-pulse" />
            <div className="h-9 w-24 bg-[var(--muted)] rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-48 bg-[var(--muted)] rounded-lg animate-pulse" />
            <div className="h-9 w-20 bg-[var(--muted)] rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center p-4 animate-pulse">
              <div className="w-14 h-14 bg-[var(--muted)] rounded-lg mb-2" />
              <div className="w-20 h-4 bg-[var(--muted)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={<FilesLoading />}>
      <FilesContent />
    </Suspense>
  );
}
