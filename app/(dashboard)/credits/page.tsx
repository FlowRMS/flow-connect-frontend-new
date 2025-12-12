import { Suspense } from 'react';
import CreditsContent from '@/components/credits/CreditsContent';

export default function CreditsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <CreditsContent />
    </Suspense>
  );
}
