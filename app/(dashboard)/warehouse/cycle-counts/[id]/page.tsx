'use client';

import { use, Suspense } from 'react';
import CycleCountDetailContent from '@/components/warehouse/CycleCountDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CycleCountDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    }>
      <CycleCountDetailContent cycleCountId={id} />
    </Suspense>
  );
}
