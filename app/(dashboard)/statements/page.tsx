/**
 * Statements Landing Page
 * Commission statements management page
 */

import { Suspense } from 'react';
import StatementsListContent from '@/components/statements/list/StatementsListContent';

function StatementsLoadingFallback() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Header Skeleton */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white/80">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
            <div>
              <div className="h-7 w-32 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-4 w-48 bg-gray-100 rounded mt-2 animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-40 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-10 w-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="flex-1" />
          <div className="h-10 w-72 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="animate-pulse">
            <div className="px-4 py-4 bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="flex-1" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            </div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-4 py-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 bg-gray-100 rounded" />
                  <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                  <div className="flex-1" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatementsPage() {
  return (
    <Suspense fallback={<StatementsLoadingFallback />}>
      <StatementsListContent />
    </Suspense>
  );
}
