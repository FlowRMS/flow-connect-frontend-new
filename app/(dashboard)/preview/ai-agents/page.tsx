import { Suspense } from 'react';
import FlowAgentsContent from '@/components/preview/FlowAgentsContent';

export default function FlowAgentsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div></div>}>
      <FlowAgentsContent />
    </Suspense>
  );
}
