'use client';

import { useRouter } from 'next/navigation';
import OrderDetailContent from '@/components/orders/detail/OrderDetailContent';

export default function NewOrderPage() {
  // Pass "new" as orderId to indicate create mode
  return <OrderDetailContent orderId="new" />;
}
