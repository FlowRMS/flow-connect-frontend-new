/**
 * Acknowledgements Page
 * Route: /acknowledgements
 *
 */

import { Suspense } from 'react';
import AcknowledgementsListContent from '@/components/acknowledgements/list/AcknowledgementsListContent';

export default function AcknowledgementsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <AcknowledgementsListContent />
    </Suspense>
  );
}
