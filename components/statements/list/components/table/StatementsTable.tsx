/**
 * StatementsTable Component
 * Beautiful, high-UX table for displaying statements
 * Features: smooth animations, hover states, infinite scroll, and sleek design
 */

'use client';

import React, { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { StatementListItem } from '../../../types';
import { useScrollPagination } from '@/components/hooks/useInfiniteScroll';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { StatementsTableHeader } from './StatementsTableHeader';

// Helper to get initials from a name
const getInitials = (name: string | undefined | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Generate a consistent color based on the name
const getAvatarColor = (name: string | undefined | null): string => {
  if (!name) return 'bg-gray-200';
  const colors = [
    'bg-emerald-100 text-emerald-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
    'bg-teal-100 text-teal-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

interface StatementsTableProps {
  statements: StatementListItem[];
  isLoading: boolean;
  selectedStatementIds: Set<string>;
  toggleStatementSelection: (id: string) => void;
  isItemSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  handleSelectAll: (selected: boolean) => void;
  handleSelectOne: (id: string, selected: boolean) => void;
  setSelectedStatement: (statement: StatementListItem | null) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  searchQuery?: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  columnFilters?: Record<string, ActiveFilter[]>;
  // Sorting
  activeSort?: { columnName: string; direction: 'ASC' | 'DESC' };
  onSortChange?: (columnName: string) => void;
  isFetching?: boolean;
}

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

export function StatementsTable({
  statements,
  isLoading,
  selectedStatementIds,
  toggleStatementSelection,
  isItemSelected,
  isAllSelected,
  isPartiallySelected,
  handleSelectAll,
  handleSelectOne,
  setSelectedStatement,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  searchQuery = '',
  hasFilters = false,
  onClearFilters,
  onColumnFiltersChange,
  columnFilters,
  activeSort,
  onSortChange,
  isFetching = false,
}: StatementsTableProps) {
  const router = useRouter();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Use shared scroll pagination hook so behavior matches invoices/adjustments
  const shouldPaginate = (hasNextPage ?? false) && !searchQuery;
  useScrollPagination(tableContainerRef, {
    hasNextPage: shouldPaginate,
    isFetchingNextPage: isFetchingNextPage ?? false,
    fetchNextPage: fetchNextPage ?? (() => {}),
    threshold: 200,
  });

  // Navigate to detail page on row click
  const handleRowClick = useCallback((statement: StatementListItem) => {
    router.push(`/statements/${statement.id}`);
  }, [router]);

  // Open side panel on view button click
  const handleViewClick = useCallback((e: React.MouseEvent, statement: StatementListItem) => {
    e.stopPropagation();
    setSelectedStatement(statement);
  }, [setSelectedStatement]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent, statementId: string) => {
    e.stopPropagation();
    handleSelectOne(statementId, !isItemSelected(statementId));
  }, [handleSelectOne, isItemSelected]);

  const handleSelectAllClick = useCallback(() => {
    handleSelectAll(!isAllSelected);
  }, [handleSelectAll, isAllSelected]);

  // Skeleton loader
  if (isLoading && statements.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
        <div
          ref={tableContainerRef}
          className="overflow-auto scrollbar-always-visible flex-1"
          style={{ maxHeight: 'calc(100vh)' }}
        >
          <table className="w-full">
            <StatementsTableHeader
              areAllEligibleSelected={isAllSelected}
              isPartiallySelected={isPartiallySelected}
              onSelectAll={handleSelectAllClick}
              onColumnFiltersChange={onColumnFiltersChange}
              columnFilters={columnFilters}
              activeSort={activeSort}
              onSortChange={onSortChange}
              isFetching={isFetching}
            />
            <tbody className="divide-y divide-gray-100">
              {[...Array(8)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="w-5 h-5 bg-gray-100 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-100 rounded w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-100 rounded w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="h-4 bg-gray-100 rounded w-20 ml-auto" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-100 rounded w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-100 rounded w-8" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && statements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6 shadow-sm">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 12h6M9 16h4"/>
          </svg>
        </div>
        {hasFilters ? (
          <>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              No statements match your filters
            </h4>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
              {searchQuery
                ? `No statements match your search "${searchQuery}". Try a different search term or clear your filters.`
                : 'Try adjusting or clearing your filters to see more statements.'}
            </p>
            {onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-red-500 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
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
                    d="M5 5l10 10M15 5L5 15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Clear filters
              </button>
            )}
          </>
        ) : (
          <>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              No Statements Found
            </h4>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
              Create your first statement to get started tracking commissions and payments.
            </p>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
      <div
        ref={tableContainerRef}
        className="overflow-auto scrollbar-always-visible flex-1"
        style={{ maxHeight: 'calc(100vh - 340px)' }}
      >
        <table className="w-full">
          <StatementsTableHeader
            areAllEligibleSelected={isAllSelected}
            isPartiallySelected={isPartiallySelected}
            onSelectAll={handleSelectAllClick}
            onColumnFiltersChange={onColumnFiltersChange}
            columnFilters={columnFilters}
            activeSort={activeSort}
            onSortChange={onSortChange}
            isFetching={isFetching}
          />
        <tbody className="divide-y divide-gray-100">
          <AnimatePresence mode="popLayout">
            {statements.map((statement, index) => {
              const isSelected = isItemSelected(statement.id);

              return (
                <motion.tr
                  key={statement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => handleRowClick(statement)}
                  className={`group cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-emerald-50/70'
                      : 'hover:bg-gray-50/80'
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => handleCheckboxClick(e, statement.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                            : 'border-gray-300 hover:border-emerald-400 group-hover:border-emerald-300'
                        }`}
                      >
                        {isSelected && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            width="12"
                            height="12"
                            viewBox="0 0 20 20"
                            fill="white"
                          >
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </motion.svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow transition-shadow">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                          <rect x="9" y="3" width="6" height="4" rx="1"/>
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {statement.statementNumber || `STM-${statement.id.substring(0, 8)}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-700 font-medium">
                      {statement.factoryName || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-500 text-sm">
                      {formatDate(statement.entityDate)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-500 text-sm">
                      {formatDate(statement.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(statement.total)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium text-emerald-600 tabular-nums">
                      {formatCurrency(statement.commission)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {statement.createdBy ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(statement.createdBy)}`}>
                          <span className="text-xs font-semibold">
                            {getInitials(statement.createdBy)}
                          </span>
                        </div>
                        <span className="text-gray-600 text-sm truncate max-w-[120px]">
                          {statement.createdBy}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => handleViewClick(e, statement)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all text-sm font-medium"
                      title="Quick view"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      View
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
        </table>
      </div>

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4 bg-gray-50/50 border-t border-gray-100">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-emerald-500" />
          <span className="ml-2 text-sm text-gray-500">Loading more...</span>
        </div>
      )}
    </div>
  );
}
