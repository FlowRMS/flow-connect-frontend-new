'use client';

import { Suspense } from 'react';
import CheckDetailContent from '@/components/commissions/detail/CheckDetailContent';

export default function NewCommissionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <CheckDetailContent checkId="new" />
    </Suspense>
  );
}
