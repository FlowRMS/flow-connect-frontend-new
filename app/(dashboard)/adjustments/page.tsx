/**
 * Adjustments Page
 * Route: /adjustments
 *
 */

import { Suspense } from 'react';
import AdjustmentsListContent from '@/components/adjustments/list/AdjustmentsListContent';

export default function AdjustmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <AdjustmentsListContent />
    </Suspense>
  );
}
