/**
 * DeductionsTab Component
 * Displays and manages deductions/adjustments for the check
 */

'use client';

import React from 'react';
import type { CommissionCheck } from '@/lib/types/rms';
import type { Adjustment, AllocationMethod, RepSplit } from '../../types';
import { formatCurrency } from '../../utils';

interface DeductionsTabProps {
  check: CommissionCheck;
  adjustments: Adjustment[];
  totalAdjustments: number;
  onAddAdjustment: () => void;
  onDeleteAdjustment: (id: string) => void;
  onUpdateAdjustment: (
    id: string,
    field: keyof Adjustment,
    value: string | number | RepSplit[] | AllocationMethod | Date
  ) => void;
  onOpenRepSplitsModal: (adjustmentId: string) => void;
}

export function DeductionsTab({
  check,
  adjustments,
  totalAdjustments,
  onAddAdjustment,
  onDeleteAdjustment,
  onUpdateAdjustment,
  onOpenRepSplitsModal,
}: DeductionsTabProps) {
  return (
    <div className="space-y-4">
      {/* Deductions Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        {adjustments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-3 py-3 text-left text-sm font-medium text-[var(--foreground)] w-28">
                    Factory
                  </th>
                  <th className="px-3 py-3 text-right text-sm font-medium text-[var(--foreground)] w-28">
                    Amount
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    Reason
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-[var(--foreground)] w-24">
                    Source
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-[var(--foreground)] w-28">
                    Created
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-[var(--foreground)] w-36">
                    Allocation
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-[var(--foreground)] w-40">
                    Target
                  </th>
                  <th className="px-3 py-3 text-center text-sm font-medium text-[var(--foreground)] w-12"></th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adj) => (
                  <tr
                    key={adj.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30"
                  >
                    {/* Factory - Read Only */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {adj.factory || check?.manufacturerName || '-'}
                      </span>
                    </td>
                    {/* Amount - Always negative */}
                    <td className="px-3 py-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-red-500">
                          -$
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={Math.abs(adj.amount)}
                          onChange={(e) =>
                            onUpdateAdjustment(
                              adj.id,
                              'amount',
                              -Math.abs(Number(e.target.value))
                            )
                          }
                          className="w-full pl-7 pr-2 py-1 bg-transparent border border-[var(--border)] rounded text-sm text-right text-red-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      </div>
                    </td>
                    {/* Reason/Type */}
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={adj.reason}
                        onChange={(e) =>
                          onUpdateAdjustment(adj.id, 'reason', e.target.value)
                        }
                        placeholder="Enter reason..."
                        className="w-full px-2 py-1 bg-transparent border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </td>
                    {/* Source */}
                    <td className="px-3 py-3">
                      {adj.source === 'upload' && adj.uploadId ? (
                        <a
                          href={`/uploads/${adj.uploadId}`}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          {adj.uploadName || 'Upload'}
                        </a>
                      ) : (
                        <span className="text-sm text-[var(--muted-foreground)]">
                          Manual
                        </span>
                      )}
                    </td>
                    {/* Created Date - Read Only */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {adj.createdAt.toLocaleDateString()}
                      </span>
                    </td>
                    {/* Allocation Method */}
                    <td className="px-3 py-3">
                      <select
                        value={adj.allocationMethod}
                        onChange={(e) => {
                          onUpdateAdjustment(
                            adj.id,
                            'allocationMethod',
                            e.target.value
                          );
                          onUpdateAdjustment(adj.id, 'allocationTarget', '');
                          if (e.target.value !== 'rep-split') {
                            onUpdateAdjustment(adj.id, 'repSplits', []);
                          }
                        }}
                        className="w-full px-2 py-1 bg-white border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      >
                        <option value="rep-split">Rep Split</option>
                        <option value="customer">Customer</option>
                        <option value="even-distribution">
                          Even Distribution
                        </option>
                      </select>
                    </td>
                    {/* Allocation Target */}
                    <td className="px-3 py-3">
                      {adj.allocationMethod === 'rep-split' && (
                        <button
                          onClick={() => onOpenRepSplitsModal(adj.id)}
                          className="w-full px-2 py-1 bg-white border border-[var(--border)] rounded text-sm text-left hover:bg-[var(--muted)] transition-colors flex items-center justify-between"
                        >
                          <span
                            className={
                              adj.repSplits.length > 0
                                ? 'text-[var(--foreground)]'
                                : 'text-[var(--muted-foreground)]'
                            }
                          >
                            {adj.repSplits.length > 0
                              ? adj.repSplits
                                  .map((s) => `${s.repName} (${s.percentage}%)`)
                                  .join(', ')
                              : 'Configure splits...'}
                          </span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M7 8l3 3 3-3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                      {adj.allocationMethod === 'customer' && (
                        <select
                          value={adj.allocationTarget}
                          onChange={(e) =>
                            onUpdateAdjustment(
                              adj.id,
                              'allocationTarget',
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 bg-white border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        >
                          <option value="">Select customer...</option>
                          <option value="Acme Corp">Acme Corp</option>
                          <option value="TechFlow Inc">TechFlow Inc</option>
                          <option value="Global Systems">Global Systems</option>
                        </select>
                      )}
                      {adj.allocationMethod === 'even-distribution' && (
                        <span className="text-sm text-[var(--muted-foreground)]">
                          Distributed evenly across check
                        </span>
                      )}
                    </td>
                    {/* Delete Button */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => onDeleteAdjustment(adj.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M6 6h8M8 6V4h4v2M4 6h12v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--muted)]/30">
                  <td className="px-3 py-3 text-sm font-medium text-[var(--foreground)]">
                    Total Deductions
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-right text-red-500">
                    -{formatCurrency(Math.abs(totalAdjustments))}
                  </td>
                  <td colSpan={6}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[var(--muted-foreground)] text-sm">
              No deductions yet
            </p>
          </div>
        )}

        {/* Add Deduction Button */}
        <div className="border-t border-[var(--border)]">
          <button
            onClick={onAddAdjustment}
            className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 6v8M6 10h8" strokeLinecap="round" />
            </svg>
            Add Deduction
          </button>
        </div>
      </div>
    </div>
  );
}

