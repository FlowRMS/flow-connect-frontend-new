/**
 * OrderDetailsSection Component
 * Displays order details (dates, manufacturer, PO, job)
 */

import type { Order } from '@/lib/types/rms';
import { formatDate } from '../../utils';

interface OrderDetailsSectionProps {
  order: Order;
}

export function OrderDetailsSection({ order }: OrderDetailsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Order Details
      </h3>
      <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Order Date
          </span>
          <span className="text-sm text-[var(--foreground)]">
            {formatDate(order.orderDate)}
          </span>
        </div>
        {order.requestedShipDate && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Requested Ship
            </span>
            <span className="text-sm text-[var(--foreground)]">
              {formatDate(order.requestedShipDate)}
            </span>
          </div>
        )}
        {order.actualShipDate && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Actual Ship
            </span>
            <span className="text-sm text-[var(--foreground)]">
              {formatDate(order.actualShipDate)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Manufacturer
          </span>
          <span className="text-sm text-[var(--foreground)]">
            {order.manufacturerName}
          </span>
        </div>
        {order.poNumber && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              PO Number
            </span>
            <span className="text-sm text-[var(--foreground)]">
              {order.poNumber}
            </span>
          </div>
        )}
        {order.jobName && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">Job</span>
            <span className="text-sm text-[var(--foreground)]">
              {order.jobName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
