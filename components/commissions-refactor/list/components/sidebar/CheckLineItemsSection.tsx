/**
 * CheckLineItemsSection Component
 * Displays line items/details of the commission check
 */

import type { CommissionCheck } from '@/lib/types/rms';
import { formatCurrency } from '../../utils';

interface CheckLineItemsSectionProps {
  check: CommissionCheck;
}

export function CheckLineItemsSection({ check }: CheckLineItemsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Details ({check.details.length})
      </h3>
      <div className="space-y-2">
        {check.details.map((detail) => (
          <div
            key={detail.id}
            className="bg-[var(--muted)]/30 rounded-lg p-3"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 text-xs rounded ${
                    detail.type === 'invoice'
                      ? 'bg-green-100 text-green-700'
                      : detail.type === 'credit'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {detail.type}
                </span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {detail.referenceNumber}
                </span>
              </div>
              <span
                className={`text-sm font-medium ${
                  detail.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {detail.amount >= 0 ? '+' : ''}
                {formatCurrency(detail.amount)}
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {detail.description}
            </p>
            {detail.customerName && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Customer: {detail.customerName}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

