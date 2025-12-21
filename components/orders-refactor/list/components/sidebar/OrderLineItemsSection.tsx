/**
 * OrderLineItemsSection Component
 * Displays order line items
 */

import type { Order } from '@/lib/types/rms';
import { formatCurrency } from '../../utils';

interface OrderLineItemsSectionProps {
  order: Order;
}

export function OrderLineItemsSection({ order }: OrderLineItemsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Line Items ({order.lineItems.length})
      </h3>
      <div className="space-y-2">
        {order.lineItems.map((item) => (
          <div
            key={item.id}
            className="bg-[var(--muted)]/30 rounded-lg p-3"
          >
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {item.partNumber}
                </span>
                {item.isCancelled && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                    Cancelled
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {formatCurrency(item.extendedPrice)}
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-1">
              {item.description}
            </p>
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>
                Qty: {item.quantity} @ {formatCurrency(item.unitPrice)}
              </span>
              <span className="text-green-600">
                Comm: {formatCurrency(item.commissionAmount)}
              </span>
            </div>
            {item.quantityShipped > 0 && (
              <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                Shipped: {item.quantityShipped} | Invoiced:{' '}
                {item.quantityInvoiced}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
