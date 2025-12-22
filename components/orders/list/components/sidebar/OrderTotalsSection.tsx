/**
 * OrderTotalsSection Component
 * Displays order totals (subtotal, freight, total, commission)
 */

import type { Order } from '@/lib/types/rms';
import { formatCurrency } from '../../utils';

interface OrderTotalsSectionProps {
  order: Order;
}

export function OrderTotalsSection({ order }: OrderTotalsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Order Totals
      </h3>
      <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Subtotal
          </span>
          <span className="text-sm text-[var(--foreground)]">
            {formatCurrency(order.subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Freight
          </span>
          <span className="text-sm text-[var(--foreground)]">
            {formatCurrency(order.freight)}
          </span>
        </div>
        <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Total
          </span>
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {formatCurrency(order.total)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-green-600">Total Commission</span>
          <span className="text-sm font-semibold text-green-600">
            {formatCurrency(order.totalCommission)}
          </span>
        </div>
      </div>
    </div>
  );
}
