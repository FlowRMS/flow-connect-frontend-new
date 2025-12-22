/**
 * InvoiceTotalsSection Component
 * Displays invoice totals (subtotal, freight, total, payments, balance, commission)
 */

import type { Invoice } from '@/lib/types/rms';
import { formatCurrency } from '../../utils';

interface InvoiceTotalsSectionProps {
  invoice: Invoice;
}

export function InvoiceTotalsSection({ invoice }: InvoiceTotalsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Invoice Totals
      </h3>
      <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Subtotal</span>
          <span className="text-sm text-[var(--foreground)]">
            {formatCurrency(invoice.subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Freight</span>
          <span className="text-sm text-[var(--foreground)]">
            {formatCurrency(invoice.freight)}
          </span>
        </div>
        <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">Total</span>
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {formatCurrency(invoice.total)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Amount Paid</span>
          <span className="text-sm text-green-600">
            {formatCurrency(invoice.amountPaid)}
          </span>
        </div>
        {invoice.amountCredited > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">Credits Applied</span>
            <span className="text-sm text-red-600">
              -{formatCurrency(invoice.amountCredited)}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">Balance Due</span>
          <span
            className={`text-sm font-semibold ${
              invoice.balance > 0 ? 'text-[var(--foreground)]' : 'text-green-600'
            }`}
          >
            {formatCurrency(invoice.balance)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-green-600">Total Commission</span>
          <span className="text-sm font-semibold text-green-600">
            {formatCurrency(invoice.totalCommission)}
          </span>
        </div>
      </div>
    </div>
  );
}

