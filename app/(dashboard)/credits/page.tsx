/**
 * Credits Page
 * Route: /credits
 *
 */

import { Suspense } from 'react';
import CreditsListContent from '@/components/credits/list/CreditsListContent';

export default function CreditsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <CreditsListContent />
    </Suspense>
  );
}
