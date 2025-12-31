/**
 * CheckDetailsFields Component
 * Collapsible section with check detail form fields and reconciliation section
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { CommissionCheck } from '@/lib/types/rms';
import type { CheckStatus, CheckWithUnpostedLines } from '../../types';
import { searchFactories, type FactorySearchResult } from '@/components/lib/api/search';
import { StyledDatePicker, parseDateString, formatDateToString } from '@/components/shared/StyledDatePicker';
import { StyledMonthPicker, parseMonthString, formatMonthToString } from '@/components/shared/StyledMonthPicker';

interface CheckDetailsFieldsProps {
  check: CommissionCheck;
  showHeaderFields: boolean;
  toggleHeaderFields: () => void;
  status: CheckStatus;
  isCreateMode?: boolean;
  // Form fields
  factory: string; // Display name
  factoryId: string;
  setFactoryId: (value: string) => void;
  setFactory: (value: string) => void;
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
  isCreateMode = false,
  factory,
  factoryId,
  setFactoryId,
  setFactory,
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
  commissionMonth,
  setCommissionMonth,
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
  // Factory search state
  const [factorySearch, setFactorySearch] = useState(factory || '');
  const [factories, setFactories] = useState<FactorySearchResult[]>([]);
  const [showFactoryDropdown, setShowFactoryDropdown] = useState(false);
  const [isSearchingFactories, setIsSearchingFactories] = useState(false);
  const [selectedFactory, setSelectedFactory] = useState<FactorySearchResult | null>(null);
  const factoryDropdownRef = useRef<HTMLDivElement>(null);

  // Update factorySearch when factory prop changes
  useEffect(() => {
    setFactorySearch(factory || '');
  }, [factory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (factoryDropdownRef.current && !factoryDropdownRef.current.contains(event.target as Node)) {
        setShowFactoryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search factories
  const handleFactorySearch = async (term: string) => {
    setFactorySearch(term);
    setIsSearchingFactories(true);
    try {
      const results = await searchFactories(term, true, 20);
      setFactories(results);
    } catch (error) {
      console.error('Error searching factories:', error);
      setFactories([]);
    } finally {
      setIsSearchingFactories(false);
    }
  };

  // Handle factory selection
  const handleSelectFactory = (factoryResult: FactorySearchResult) => {
    setSelectedFactory(factoryResult);
    setFactorySearch(factoryResult.title);
    setFactory(factoryResult.title);
    setFactoryId(factoryResult.id);
    setShowFactoryDropdown(false);
  };

  // Clear factory selection
  const handleClearFactory = () => {
    setSelectedFactory(null);
    setFactorySearch('');
    setFactory('');
    setFactoryId('');
  };

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
              <div className="grid grid-cols-5 gap-4">
                {/* Factory - Searchable when in create mode, read-only otherwise */}
                <div ref={factoryDropdownRef} className="relative">
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Factory <span className="text-red-500">*</span>
                  </label>
                  {isCreateMode || !factoryId ? (
                    <>
                      <div className="flex gap-1">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={factorySearch}
                            onChange={(e) => {
                              handleFactorySearch(e.target.value);
                              setShowFactoryDropdown(true);
                              if (selectedFactory && e.target.value !== selectedFactory.title) {
                                setSelectedFactory(null);
                              }
                            }}
                            onFocus={() => {
                              setShowFactoryDropdown(true);
                              if (!factories.length) handleFactorySearch('');
                            }}
                            placeholder="Search factories..."
                            className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          />
                          {isSearchingFactories && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]" />
                            </div>
                          )}
                        </div>
                        {(selectedFactory || factoryId) && (
                          <button
                            onClick={handleClearFactory}
                            type="button"
                            className="px-2 py-2 text-gray-500 hover:text-gray-700 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {(selectedFactory || factoryId) && (
                        <p className="mt-1 text-xs text-green-600 truncate">
                          ✓ {factory || selectedFactory?.title}
                        </p>
                      )}

                      {/* Factory Dropdown */}
                      {showFactoryDropdown && !(selectedFactory || factoryId) && (
                        <div className="absolute z-30 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {factories.length > 0 ? (
                            factories.map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => handleSelectFactory(f)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900 text-sm">{f.title}</div>
                                {f.accountNumber && (
                                  <div className="text-xs text-gray-500">Acct: {f.accountNumber}</div>
                                )}
                              </button>
                            ))
                          ) : !isSearchingFactories ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              {factorySearch ? `No factories found` : 'No factories available'}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      value={factory || '-'}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] cursor-not-allowed"
                    />
                  )}
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
                    <div className="flex items-center gap-1.5 mt-1.5 opacity-50">
                      <input
                        type="checkbox"
                        checked={isTiedToCommissionUpload}
                        readOnly
                        disabled
                        className="w-3.5 h-3.5 accent-[var(--primary)] pointer-events-none cursor-not-allowed"
                      />
                      <span className="text-xs text-[var(--muted-foreground)] border-b border-dashed border-[var(--muted-foreground)] cursor-help">
                        Tied to commission upload
                      </span>
                      <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                        Coming Soon
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
                  <StyledDatePicker
                    selected={parseDateString(checkDate)}
                    onChange={(date) => setCheckDate(formatDateToString(date))}
                    placeholder="Select date..."
                    className="!py-2 !px-3 !rounded-md !text-sm"
                  />
                </div>

                {/* Posted Date (only when posted) */}
                {status === 'posted' && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Posted Date
                    </label>
                    <StyledDatePicker
                      selected={parseDateString(postedDate)}
                      onChange={(date) => setPostedDate(formatDateToString(date))}
                      placeholder="Select date..."
                      className="!py-2 !px-3 !rounded-md !text-sm"
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
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-not-allowed opacity-50">
                    <input
                      type="checkbox"
                      checked={isTotalStatedCommission}
                      disabled
                      className="w-3.5 h-3.5 accent-[var(--primary)] cursor-not-allowed"
                    />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Is Total Stated Commission
                    </span>
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                      Coming Soon
                    </span>
                  </label>
                </div>

                {/* Commission Month */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Commission Month
                  </label>
                  <StyledMonthPicker
                    selected={parseMonthString(commissionMonth)}
                    onChange={(date) => setCommissionMonth(formatMonthToString(date))}
                    placeholder="Select month..."
                    className="!py-2 !px-3 !rounded-md !text-sm"
                  />
                </div>
              </div>

              {/* Lines to Reconcile Section - Only show when unposted */}
              {status === 'unposted' && (
                <div className="mt-4 opacity-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--muted-foreground)]">
                      Lines to Reconcile
                    </span>
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                      Coming Soon
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
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
                        disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm cursor-not-allowed"
                      />
                      <label className="flex items-center gap-1.5 mt-1.5 cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={includeAllUnpaid}
                          disabled
                          className="w-3.5 h-3.5 accent-[var(--primary)] cursor-not-allowed"
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

