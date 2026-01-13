import { Suspense } from 'react';
import DeliveryIssueDetailContent from '@/components/warehouse/DeliveryIssueDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeliveryIssueDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted-foreground)]">Loading...</div>
        </div>
      }
    >
      <DeliveryIssueDetailContent issueId={id} />
    </Suspense>
  );
}
