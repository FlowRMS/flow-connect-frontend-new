'use client';

import { use, Suspense } from 'react';
import CheckDetailContent from '@/components/commissions-refactor/detail/CheckDetailContent';

export default function CommissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <CheckDetailContent checkId={resolvedParams.id} />
    </Suspense>
  );
}

