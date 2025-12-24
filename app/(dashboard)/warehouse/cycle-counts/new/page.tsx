'use client';

import { Suspense } from 'react';
import NewCycleCountContent from '@/components/warehouse/NewCycleCountContent';

export default function NewCycleCountPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    }>
      <NewCycleCountContent />
    </Suspense>
  );
}
