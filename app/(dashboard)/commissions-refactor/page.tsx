/**
 * Commissions Refactor Testing Page
 * Route: /commissions-refactor
 *
 * This is a testing route to view the refactored commissions list
 * while keeping the original /commissions route intact
 */

import { Suspense } from 'react';
import CommissionsListContent from '@/components/commissions-refactor/list/CommissionsListContent';

export default function CommissionsRefactorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <CommissionsListContent />
    </Suspense>
  );
}

