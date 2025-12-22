/**
 * CheckDetailsFields Component
 * Collapsible section with check detail form fields and reconciliation section
 */

import React from 'react';
import type { CommissionCheck } from '@/lib/types/rms';
import type { CheckStatus, CheckWithUnpostedLines } from '../../types';

interface CheckDetailsFieldsProps {
  check: CommissionCheck;
  showHeaderFields: boolean;
  toggleHeaderFields: () => void;
  status: CheckStatus;
  // Form fields
  factory: string; // Read-only
  checkNumber: string;
  setCheckNumber: (value: string) => void;
  checkDate: string;
  setCheckDate: (value: string) => void;
  postedDate: string;
  setPostedDate: (value: string) => void;
  commissionAmount: number;
  setCommissionAmount: (value: number) => void;
  isTotalStatedCommission: boolean;
  setIsTotalStatedCommission: (value: boolean) => void;
  isTiedToCommissionUpload: boolean;
  commissionMonth: string;
  setCommissionMonth: (value: string) => void;
  // Reconciliation summary
  summary: {
    expectedTotal: number;
    paidTotal: number;
    balanceTotal: number;
    lineCount: number;
  };
  totalAdjustments: number;
  // Lines to Reconcile (only when unposted)
  selectedCheckNumbers: string[];
  setSelectedCheckNumbers: (value: string[] | ((prev: string[]) => string[])) => void;
  showCheckNumbersDropdown: boolean;
  setShowCheckNumbersDropdown: (value: boolean) => void;
  checkNumberSearch: string;
  setCheckNumberSearch: (value: string) => void;
  unpaidInvoicesAfterDate: string;
  setUnpaidInvoicesAfterDate: (value: string) => void;
  includeAllUnpaid: boolean;
  setIncludeAllUnpaid: (value: boolean) => void;
  ordersWithoutInvoicesAfterDate: string;
  setOrdersWithoutInvoicesAfterDate: (value: string) => void;
  includeAllOrdersWithoutInvoices: boolean;
  setIncludeAllOrdersWithoutInvoices: (value: boolean) => void;
  filteredChecks: CheckWithUnpostedLines[];
  currentCheckId: string;
}

export function CheckDetailsFields({
  check,
  showHeaderFields,
  toggleHeaderFields,
  status,
  factory,
  checkNumber,
  setCheckNumber,
  checkDate,
  setCheckDate,
  postedDate,
  setPostedDate,
  commissionAmount,
  setCommissionAmount,
  isTotalStatedCommission,
  setIsTotalStatedCommission,
  isTiedToCommissionUpload,
  summary,
  totalAdjustments,
  selectedCheckNumbers,
  setSelectedCheckNumbers,
  showCheckNumbersDropdown,
  setShowCheckNumbersDropdown,
  checkNumberSearch,
  setCheckNumberSearch,
  unpaidInvoicesAfterDate,
  setUnpaidInvoicesAfterDate,
  includeAllUnpaid,
  setIncludeAllUnpaid,
  ordersWithoutInvoicesAfterDate,
  setOrdersWithoutInvoicesAfterDate,
  includeAllOrdersWithoutInvoices,
  setIncludeAllOrdersWithoutInvoices,
  filteredChecks,
  currentCheckId,
}: CheckDetailsFieldsProps) {
  const checkAmt = isTotalStatedCommission ? summary.paidTotal : commissionAmount;
  const balance = checkAmt - summary.paidTotal + totalAdjustments;
  const reconciledPercentage =
    checkAmt > 0
      ? ((summary.paidTotal - totalAdjustments) / checkAmt) * 100
      : 0;

  const toggleCheckNumber = (checkId: string) => {
    if (checkId === currentCheckId) return; // Can't deselect current check
    setSelectedCheckNumbers((prev: string[]) =>
      prev.includes(checkId)
        ? prev.filter((c: string) => c !== checkId)
        : [...prev, checkId]
    );
  };

  return (
    <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
      <button
        onClick={toggleHeaderFields}
        className="w-full px-6 py-2 flex items-center justify-between text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <span className="font-medium">Check Details</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${showHeaderFields ? 'rotate-180' : ''}`}
        >
          <path
            d="M6 8l4 4 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {showHeaderFields && (
        <div className="px-6 pb-4">
          <div className="flex gap-6">
            {/* Left side - Form fields */}
            <div className="flex-1">
              <div className="grid grid-cols-4 gap-4">
                {/* Factory */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Factory
                  </label>
                  <input
                    type="text"
                    value={factory || '-'}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] cursor-not-allowed"
                  />
                </div>

                {/* Check Number */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Check Number
                  </label>
                  <input
                    type="text"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                  />
                  <div className="relative inline-block group">
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <input
                        type="checkbox"
                        checked={isTiedToCommissionUpload}
                        readOnly
                        className="w-3.5 h-3.5 accent-[var(--primary)] pointer-events-none"
                      />
                      <span className="text-xs text-[var(--muted-foreground)] border-b border-dashed border-[var(--muted-foreground)] cursor-help">
                        Tied to commission upload
                      </span>
                    </div>
                    <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      Check is associated with a specific commission statement
                      upload
                      <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>

                {/* Check Date */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Check Date
                  </label>
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                  />
                </div>

                {/* Posted Date (only when posted) */}
                {status === 'posted' && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Posted Date
                    </label>
                    <input
                      type="date"
                      value={postedDate}
                      onChange={(e) => setPostedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                    />
                  </div>
                )}

                {/* Check Amount */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Check Amount<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">
                      $
                    </span>
                    <input
                      type="number"
                      value={checkAmt}
                      onChange={(e) =>
                        !isTotalStatedCommission &&
                        setCommissionAmount(Number(e.target.value))
                      }
                      readOnly={isTotalStatedCommission}
                      className={`w-full pl-7 pr-3 py-2 border border-[var(--border)] rounded-md text-sm ${
                        isTotalStatedCommission
                          ? 'bg-gray-50 text-[var(--muted-foreground)] cursor-not-allowed'
                          : 'bg-white'
                      }`}
                    />
                  </div>
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTotalStatedCommission}
                      onChange={(e) =>
                        setIsTotalStatedCommission(e.target.checked)
                      }
                      className="w-3.5 h-3.5 accent-[var(--primary)]"
                    />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Is Total Stated Commission
                    </span>
                  </label>
                </div>
              </div>

              {/* Lines to Reconcile Section - Only show when unposted */}
              {status === 'unposted' && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-[var(--muted-foreground)]">
                    Lines to Reconcile
                  </span>
                  <div className="grid grid-cols-4 gap-4 mt-2">
                    {/* Check Number Multi-Select */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Check Number
                      </label>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowCheckNumbersDropdown(!showCheckNumbersDropdown)
                          }
                          className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm text-left flex items-center justify-between"
                        >
                          <span
                            className={
                              selectedCheckNumbers.length > 0
                                ? 'text-[var(--foreground)]'
                                : 'text-[var(--muted-foreground)]'
                            }
                          >
                            {selectedCheckNumbers.length > 0
                              ? `${selectedCheckNumbers.length} check${selectedCheckNumbers.length > 1 ? 's' : ''} selected`
                              : 'Select checks...'}
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
                              d="M6 8l4 4 4-4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {showCheckNumbersDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowCheckNumbersDropdown(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
                              <div className="p-2 border-b border-[var(--border)]">
                                <input
                                  type="text"
                                  placeholder="Search checks..."
                                  value={checkNumberSearch}
                                  onChange={(e) =>
                                    setCheckNumberSearch(e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 bg-[var(--muted)] border-0 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredChecks.map((chk) => {
                                  const isCurrentCheck =
                                    chk.id === currentCheckId;
                                  return (
                                    <label
                                      key={chk.id}
                                      className={`flex items-center gap-2 px-3 py-2 hover:bg-[var(--muted)] ${
                                        isCurrentCheck
                                          ? 'cursor-not-allowed bg-[var(--muted)]/50'
                                          : 'cursor-pointer'
                                      }`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedCheckNumbers.includes(
                                          chk.id
                                        )}
                                        disabled={isCurrentCheck}
                                        onChange={() => toggleCheckNumber(chk.id)}
                                        className="accent-[var(--primary)]"
                                      />
                                      <span className="text-sm">
                                        {chk.checkNumber}
                                      </span>
                                      {isCurrentCheck && (
                                        <span className="text-xs text-[var(--muted-foreground)]">
                                          (current)
                                        </span>
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Unpaid Invoices After */}
                    <div>
                      <div className="relative inline-block group">
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1 cursor-help border-b border-dashed border-[var(--muted-foreground)] inline-block">
                          Invoices after:
                        </label>
                        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          Does not include invoices marked "dormant" or on other
                          checks
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                      <input
                        type="date"
                        value={unpaidInvoicesAfterDate}
                        onChange={(e) =>
                          setUnpaidInvoicesAfterDate(e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                      />
                      <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeAllUnpaid}
                          onChange={(e) =>
                            setIncludeAllUnpaid(e.target.checked)
                          }
                          className="w-3.5 h-3.5 accent-[var(--primary)]"
                        />
                        <span className="text-xs text-[var(--muted-foreground)]">
                          All
                        </span>
                      </label>
                    </div>

                    {/* Orders Without Invoices After */}
                    <div>
                      <div className="relative inline-block group">
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1 cursor-help border-b border-dashed border-[var(--muted-foreground)] inline-block">
                          Orders without invoices after:
                        </label>
                        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          Does not include orders marked "dormant" or on other
                          checks
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                      <input
                        type="date"
                        value={ordersWithoutInvoicesAfterDate}
                        onChange={(e) =>
                          setOrdersWithoutInvoicesAfterDate(e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                      />
                      <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeAllOrdersWithoutInvoices}
                          onChange={(e) =>
                            setIncludeAllOrdersWithoutInvoices(e.target.checked)
                          }
                          className="w-3.5 h-3.5 accent-[var(--primary)]"
                        />
                        <span className="text-xs text-[var(--muted-foreground)]">
                          All
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Reconciliation Summary */}
            <div className="w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border border-[var(--border)] p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        Check Amount
                      </span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        ${checkAmt.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        Stated Commissions
                      </span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        -${summary.paidTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        Deductions
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          totalAdjustments === 0
                            ? 'text-[var(--foreground)]'
                            : totalAdjustments < 0
                            ? 'text-red-500'
                            : 'text-green-600'
                        }`}
                      >
                        {totalAdjustments < 0 ? '-' : totalAdjustments > 0 ? '+' : ''}
                        ${Math.abs(totalAdjustments).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        Balance to Reconcile
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          balance === 0
                            ? 'text-green-600'
                            : balance > 0
                            ? 'text-orange-500'
                            : 'text-red-500'
                        }`}
                      >
                        ${balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {balance !== 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] rounded-full transition-all"
                          style={{
                            width: `${Math.min(reconciledPercentage, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 text-center">
                        {reconciledPercentage.toFixed(0)}% reconciled
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

