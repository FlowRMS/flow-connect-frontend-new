'use client';

import { Suspense } from 'react';
import CustomerFactorySalesRepSettings from '@/components/settings/CustomerFactorySalesRepSettings';

export default function SalesRepAssignmentsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Loading...</div>
      </div>
    }>
      <CustomerFactorySalesRepSettings />
    </Suspense>
  );
}
