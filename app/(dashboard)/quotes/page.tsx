import { Suspense } from 'react';
import QuotesContent from '@/components/QuotesContent';

export default function QuotesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <QuotesContent />
    </Suspense>
  );
}
