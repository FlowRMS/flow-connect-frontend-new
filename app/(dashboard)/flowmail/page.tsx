import { Suspense } from 'react';
import FlowmailContent from '@/components/FlowmailContent';

export default function FlowmailPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <FlowmailContent />
    </Suspense>
  );
}
