/**
 * InvoiceDetailsSection Component
 * Displays invoice details (dates, order, manufacturer)
 */

import type { Invoice } from '@/lib/types/rms';
import { formatDate, isOverdue } from '../../utils';

interface InvoiceDetailsSectionProps {
  invoice: Invoice;
}

export function InvoiceDetailsSection({ invoice }: InvoiceDetailsSectionProps) {
  const overdue = isOverdue(invoice);

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Invoice Details
      </h3>
      <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Invoice Date</span>
          <span className="text-sm text-[var(--foreground)]">
            {formatDate(invoice.invoiceDate)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Due Date</span>
          <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-[var(--foreground)]'}`}>
            {formatDate(invoice.dueDate)}
          </span>
        </div>
        {invoice.paidDate && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">Paid Date</span>
            <span className="text-sm text-green-600">
              {formatDate(invoice.paidDate)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Order</span>
          <span className="text-sm text-[var(--primary)] cursor-pointer hover:underline">
            {invoice.orderNumber}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Manufacturer</span>
          <span className="text-sm text-[var(--foreground)]">
            {invoice.manufacturerName}
          </span>
        </div>
      </div>
    </div>
  );
}

