import FulfillmentOrderDetailContent from '@/components/warehouse/FulfillmentOrderDetailContent';

interface FulfillmentOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FulfillmentOrderDetailPage({ params }: FulfillmentOrderDetailPageProps) {
  const { id } = await params;
  return <FulfillmentOrderDetailContent fulfillmentOrderId={id} />;
}
