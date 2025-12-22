/**
 * InvoiceLineItemsSection Component
 * Displays invoice line items
 */

import type { Invoice } from '@/lib/types/rms';
import { formatCurrency } from '../../utils';

interface InvoiceLineItemsSectionProps {
  invoice: Invoice;
}

export function InvoiceLineItemsSection({ invoice }: InvoiceLineItemsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Line Items ({invoice.lineItems.length})
      </h3>
      <div className="space-y-2">
        {invoice.lineItems.map((item) => (
          <div
            key={item.id}
            className="bg-[var(--muted)]/30 rounded-lg p-3"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {item.partNumber}
              </span>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {formatCurrency(item.amount)}
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
          </div>
        ))}
      </div>
    </div>
  );
}

