/**
 * PostedStatementModal Component
 * Modal displaying posted statement details for a check
 * Uses the postedStatement GraphQL endpoint for data
 */

'use client';

import React, { useMemo } from 'react';
import type {
  PostedStatement,
  PostedStatementDetail,
  PostedStatementRepSummary,
} from '@/components/orders/api/checksApi';
import { formatCurrency } from '../../utils';

interface PostedStatementModalProps {
  checkId: string;
  postedStatement: PostedStatement | null | undefined;
  isLoading: boolean;
  error: Error | null;
  onClose: () => void;
  onDownloadExcel: () => void;
}

export function PostedStatementModal({
  checkId,
  postedStatement,
  isLoading,
  error,
  onClose,
  onDownloadExcel,
}: PostedStatementModalProps) {
  // Calculate summary totals from details
  const summaryTotals = useMemo(() => {
    if (!postedStatement?.details) {
      return { paidTotal: 0, expectedTotal: 0 };
    }

    return postedStatement.details.reduce(
      (acc, detail) => {
        const received = parseFloat(detail.commissionReceived || '0');
        const expected = parseFloat(detail.expectedCommission || '0');
        return {
          paidTotal: acc.paidTotal + received,
          expectedTotal: acc.expectedTotal + expected,
        };
      },
      { paidTotal: 0, expectedTotal: 0 }
    );
  }, [postedStatement?.details]);

  const header = postedStatement?.header;
  const details = postedStatement?.details || [];
  const repSummaries = postedStatement?.repSummaries || [];

  // Format commission month for display (e.g., "2025-09" -> "September, 2025")
  const formatCommissionMonth = (monthStr: string | undefined): string => {
    if (!monthStr) return '-';
    try {
      // Handle both YYYY-MM and YYYY-MM-DD formats
      const dateParts = monthStr.split('-');
      if (dateParts.length >= 2) {
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      return monthStr;
    } catch {
      return monthStr;
    }
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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
              disabled={isLoading || !postedStatement}
              className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
              <span className="ml-3 text-[var(--muted-foreground)]">Loading posted statement...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">Error loading posted statement</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && postedStatement && (
            <>
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
                        {header?.checkNumber || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--primary)]">Factory</span>
                      <span className="text-sm text-[var(--foreground)]">
                        {header?.factoryName || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--primary)]">
                        Check Date
                      </span>
                      <span className="text-sm text-[var(--foreground)]">
                        {formatDateDisplay(header?.entityDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--primary)]">
                        Check Amount
                      </span>
                      <span className="text-sm text-[var(--foreground)]">
                        {formatCurrency(parseFloat(header?.commissionAmount || '0'))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--primary)]">
                        Commission Month
                      </span>
                      <span className="text-sm text-[var(--foreground)]">
                        {formatCommissionMonth(header?.commissionMonth)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--primary)]">
                        Post Date
                      </span>
                      <span className="text-sm text-[var(--foreground)]">
                        {formatDateDisplay(header?.postDate)}
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
                        Commission Received
                      </span>
                      <span className="text-sm text-[var(--foreground)]">
                        {formatCurrency(summaryTotals.paidTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--primary)]">
                        Commission Amount
                      </span>
                      <span className="text-sm text-[var(--foreground)]">
                        {formatCurrency(parseFloat(header?.commissionAmount || '0'))}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                      <span className="text-sm text-[var(--primary)]">Balance</span>
                      <span
                        className={`text-sm font-medium ${
                          summaryTotals.paidTotal - parseFloat(header?.commissionAmount || '0') >= 0
                            ? 'text-green-600'
                            : 'text-red-500'
                        }`}
                      >
                        {formatCurrency(
                          summaryTotals.paidTotal - parseFloat(header?.commissionAmount || '0')
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rep Summaries - show if there are multiple reps */}
              {repSummaries.length > 0 && (
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
                  <div className="p-4 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">
                      Rep Summaries
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                          <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                            Sales Rep
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                            Expected Commission
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                            Commission Received
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {repSummaries.map((rep, index) => (
                          <tr
                            key={rep.outsideSalesRepId || index}
                            className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30"
                          >
                            <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                              {rep.outsideSalesRepName || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">
                              {formatCurrency(parseFloat(rep.expectedCommission || '0'))}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">
                              {formatCurrency(parseFloat(rep.commissionReceived || '0'))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                      {details.map((detail, index) => (
                        <tr
                          key={`${detail.entityNumber}-${index}`}
                          className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30"
                        >
                          <td className="px-4 py-3 text-sm text-[var(--foreground)] uppercase">
                            {detail.entityType || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                            {detail.entityNumber || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                            {detail.orderNumber || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">
                            {formatCurrency(parseFloat(detail.expectedCommission || '0'))}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">
                            {formatCurrency(parseFloat(detail.commissionReceived || '0'))}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">
                            {detail.salesAmount
                              ? formatCurrency(parseFloat(detail.salesAmount))
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                            {detail.outsideSalesRepName || '-'}
                          </td>
                        </tr>
                      ))}
                      {details.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                            No details available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                  <span>
                    Showing 1 to {details.length} of {details.length} entries
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
            </>
          )}

          {/* No data state */}
          {!isLoading && !error && !postedStatement && (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">No posted statement data available.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

