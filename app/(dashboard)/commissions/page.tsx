import { Suspense } from 'react';
import CommissionsContent from '@/components/commissions/CommissionsContent';

export default function CommissionsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <CommissionsContent />
    </Suspense>
  );
}
