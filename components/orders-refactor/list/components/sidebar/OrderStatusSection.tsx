/**
 * OrderStatusSection Component
 * Displays order status badges (order, fulfillment, billing, commission)
 */

import type { Order } from '@/lib/types/rms';
import {
  orderStatusLabels,
  orderStatusColors,
  fulfillmentStatusLabels,
  fulfillmentStatusColors,
  billingStatusLabels,
  billingStatusColors,
  commissionStatusLabels,
  commissionStatusColors,
} from '../../constants';

interface OrderStatusSectionProps {
  order: Order;
}

export function OrderStatusSection({ order }: OrderStatusSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Status
      </h3>
      <div className="flex flex-wrap gap-2">
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            orderStatusColors[order.status]
          }`}
        >
          {orderStatusLabels[order.status]}
        </span>
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            fulfillmentStatusColors[order.fulfillmentStatus]
          }`}
        >
          {fulfillmentStatusLabels[order.fulfillmentStatus]}
        </span>
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            billingStatusColors[order.billingStatus]
          }`}
        >
          {billingStatusLabels[order.billingStatus]}
        </span>
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            commissionStatusColors[order.commissionStatus]
          }`}
        >
          {commissionStatusLabels[order.commissionStatus]}
        </span>
      </div>
    </div>
  );
}
