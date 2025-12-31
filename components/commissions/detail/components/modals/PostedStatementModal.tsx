/**
 * PostedStatementModal Component
 * Modal displaying posted statement details for a check
 */

'use client';

import React from 'react';
import type { CommissionCheck } from '@/lib/types/rms';
import type { LineItem, Adjustment } from '../../types';
import { formatCurrency } from '../../utils';

interface PostedStatementModalProps {
  check: CommissionCheck;
  checkNumber: string;
  checkDate: string;
  commissionMonth: string;
  postedDate: string;
  commissionAmount: number;
  isTotalStatedCommission: boolean;
  summary: {
    expectedTotal: number;
    paidTotal: number;
    balanceTotal: number;
    lineCount: number;
  };
  lineItems: LineItem[];
  adjustments: Adjustment[];
  onClose: () => void;
  onDownloadExcel: () => void;
}

export function PostedStatementModal({
  check,
  checkNumber,
  checkDate,
  commissionMonth,
  postedDate,
  commissionAmount,
  isTotalStatedCommission,
  summary,
  lineItems,
  adjustments,
  onClose,
  onDownloadExcel,
}: PostedStatementModalProps) {
  const checkAmount = isTotalStatedCommission
    ? summary.paidTotal
    : commissionAmount;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] max-h-[90vh] bg-[var(--background)] rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Posted Statement
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadExcel}
              className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download Excel
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--muted)] rounded"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Check Summary */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-5">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">
                Check Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Check Number
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {checkNumber || 'Test'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">Factory</span>
                  <span className="text-sm text-[var(--foreground)]">
                    {check?.manufacturerName || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Check Date
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {checkDate
                      ? new Date(checkDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Check Amount
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {formatCurrency(checkAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Commission Month
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {commissionMonth || 'September, 2025'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Post Date
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {postedDate
                      ? new Date(postedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commission Summary */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-5">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">
                Commission Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Paid Commissions
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {formatCurrency(summary.paidTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Credits Applied
                  </span>
                  <span className="text-sm text-[var(--foreground)]">$0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Expenses Applied
                  </span>
                  <span className="text-sm text-[var(--foreground)]">$0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Applied Total
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {formatCurrency(summary.paidTotal)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--primary)]">
                    Expected Commission
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {formatCurrency(summary.expectedTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--primary)]">
                    Adjusted Expected Commission
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {formatCurrency(summary.expectedTotal)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--primary)]">Balance</span>
                  <span
                    className={`text-sm font-medium ${
                      summary.paidTotal - summary.expectedTotal >= 0
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {formatCurrency(
                      summary.paidTotal - summary.expectedTotal
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                Details
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                      Entity Number
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                      Order Number
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                      Expected Commission
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                      Commission Received
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                      Sales Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                      Outside Sales Rep
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems
                    .filter((item) => item.paid)
                    .map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30"
                      >
                        <td className="px-4 py-3 text-sm text-[var(--foreground)] uppercase">
                          {item.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                          {item.number}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                          {item.orderId ? (
                            <span className="font-mono text-xs">{item.orderId.substring(0, 8)}...</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">
                          ${item.expectedCommission.toFixed(5)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">
                          ${item.paidCommission.toFixed(5)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">
                          $
                          {(
                            item.paidCommission /
                            (item.commissionRateActual / 100)
                          ).toFixed(5)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                          {item.salesRep}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--muted-foreground)]">
              <span>
                Showing 1 to {lineItems.filter((item) => item.paid).length} of{' '}
                {lineItems.filter((item) => item.paid).length} entries
              </span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-full text-sm">
                  1
                </button>
                <select className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm bg-white">
                  <option>20</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Credits & Expenses Applied */}
          {adjustments.length > 0 && (
            <div className="mt-6 bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--foreground)]">
                  Credits & Expenses Applied
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                        Applied To
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustments.map((adj) => (
                      <tr
                        key={adj.id}
                        className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30"
                      >
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                          Deduction
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                          {adj.reason || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                          {adj.allocationMethod === 'rep-split' &&
                          adj.repSplits.length > 0
                            ? adj.repSplits.map((s) => s.repName).join(', ')
                            : adj.allocationMethod === 'customer'
                            ? adj.allocationTarget
                            : 'Even Distribution'}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-500 text-right">
                          -{formatCurrency(Math.abs(adj.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

