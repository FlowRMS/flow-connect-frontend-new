/**
 * PricingSummaryBar Component
 * Displays check totals summary
 */

import React from 'react';
import { formatCurrency, formatNumber } from '../../utils';

import type { CheckStatus } from '../../types';

interface PricingSummaryBarProps {
  status: CheckStatus;
  summary: {
    expectedTotal: number;
    paidTotal: number;
    balanceTotal: number;
    lineCount: number;
  };
  totalAdjustments: number;
  commissionAmount: number;
  isTotalStatedCommission: boolean;
}

export function PricingSummaryBar({
  status,
  summary,
  totalAdjustments,
  commissionAmount,
  isTotalStatedCommission,
}: PricingSummaryBarProps) {
  const checkAmt = isTotalStatedCommission ? summary.paidTotal : commissionAmount;
  const balance = checkAmt - summary.paidTotal + totalAdjustments;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0 px-6 py-2 flex items-center justify-end">
      <div className="flex items-center gap-3 text-xs">
        <span className="text-[var(--muted-foreground)]">
          Expected:{' '}
          <span className="font-medium text-[var(--foreground)]">
            {formatCurrency(summary.expectedTotal)}
          </span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Paid:{' '}
          <span className="font-medium text-green-600">
            {formatCurrency(summary.paidTotal)}
          </span>
        </span>
        <span className="text-[var(--muted-foreground)]">|</span>
        <span className="text-[var(--muted-foreground)]">
          Balance:{' '}
          <span
            className={`font-semibold ${
              summary.balanceTotal >= 0
                ? 'text-green-600'
                : 'text-[var(--foreground)]'
            }`}
          >
            {formatCurrency(summary.balanceTotal)}
          </span>
        </span>
        {status === 'unposted' && (
          <>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              Adjustments:{' '}
              <span
                className={`font-medium ${
                  totalAdjustments === 0
                    ? 'text-[var(--foreground)]'
                    : totalAdjustments < 0
                    ? 'text-red-500'
                    : 'text-green-600'
                }`}
              >
                {totalAdjustments < 0 ? '-' : totalAdjustments > 0 ? '+' : ''}
                {formatCurrency(Math.abs(totalAdjustments))}
              </span>
            </span>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              Check Amount:{' '}
              <span className="font-medium text-[var(--foreground)]">
                {formatCurrency(checkAmt)}
              </span>
            </span>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              To Reconcile:{' '}
              <span
                className={`font-semibold ${
                  balance === 0
                    ? 'text-green-600'
                    : balance > 0
                    ? 'text-orange-500'
                    : 'text-red-500'
                }`}
              >
                {formatCurrency(balance)}
              </span>
            </span>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              Reconciled:{' '}
              <span
                className={`font-semibold ${
                  checkAmt > 0
                    ? ((summary.paidTotal - totalAdjustments) / checkAmt) * 100 ===
                      100
                      ? 'text-green-600'
                      : 'text-orange-500'
                    : 'text-green-600'
                }`}
              >
                {checkAmt > 0
                  ? formatNumber(
                      ((summary.paidTotal - totalAdjustments) / checkAmt) * 100,
                      0
                    )
                  : 0}
                %
              </span>
            </span>
          </>
        )}
        {status === 'unposted' && balance !== 0 && (
          <>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              To Reconcile:{' '}
              <span
                className={`font-semibold ${
                  balance === 0
                    ? 'text-green-600'
                    : balance > 0
                    ? 'text-orange-500'
                    : 'text-red-500'
                }`}
              >
                {formatCurrency(balance)}
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

