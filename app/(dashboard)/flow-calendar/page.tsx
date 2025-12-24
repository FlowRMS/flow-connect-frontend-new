import { Suspense } from 'react';
import FlowCalendarContent from '@/components/FlowCalendarContent';

export default function FlowCalendarPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <FlowCalendarContent />
    </Suspense>
  );
}
