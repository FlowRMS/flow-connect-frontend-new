import { Suspense } from 'react';
import ReceivingDetailContent from '@/components/warehouse/deliveries/receiving/ReceivingDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceivingDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <ReceivingDetailContent shipmentId={id} />
    </Suspense>
  );
}
