/**
 * CheckTotalsSection Component
 * Displays check totals and balances
 */

import type { CommissionCheck } from '@/lib/types/rms';
import { formatCurrency } from '../../utils';

interface CheckTotalsSectionProps {
  check: CommissionCheck;
}

export function CheckTotalsSection({ check }: CheckTotalsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Check Totals
      </h3>
      <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Invoice Payments
          </span>
          <span className="text-sm text-green-600">
            +{formatCurrency(check.invoicePayments)}
          </span>
        </div>
        {check.expenseAdjustments !== 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Expense Adjustments
            </span>
            <span className="text-sm text-blue-600">
              {check.expenseAdjustments >= 0 ? '+' : ''}
              {formatCurrency(check.expenseAdjustments)}
            </span>
          </div>
        )}
        {check.creditDeductions !== 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Credit Deductions
            </span>
            <span className="text-sm text-red-600">
              -{formatCurrency(check.creditDeductions)}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Net Amount
          </span>
          <span className="text-sm font-bold text-[var(--foreground)]">
            {formatCurrency(check.netAmount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Check Balance
          </span>
          <span className="text-sm font-bold text-[var(--foreground)]">
            {formatCurrency(check.checkBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}

