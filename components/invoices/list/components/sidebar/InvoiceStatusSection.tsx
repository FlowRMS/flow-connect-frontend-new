/**
 * InvoiceStatusSection Component
 * Displays invoice status badges (status, overdue, locked)
 */

import type { Invoice } from '@/lib/types/rms';
import { invoiceStatusLabels, invoiceStatusColors } from '../../constants';
import { isOverdue } from '../../utils';

interface InvoiceStatusSectionProps {
  invoice: Invoice;
}

export function InvoiceStatusSection({ invoice }: InvoiceStatusSectionProps) {
  const overdue = isOverdue(invoice);

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Status
      </h3>
      <div className="flex flex-wrap gap-2">
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            invoiceStatusColors[invoice.status]
          }`}
        >
          {invoiceStatusLabels[invoice.status]}
        </span>
        {overdue && (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
            Overdue
          </span>
        )}
        {invoice.isLocked && (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Locked
          </span>
        )}
      </div>
    </div>
  );
}

