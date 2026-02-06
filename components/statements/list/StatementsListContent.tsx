/**
 * StatementsListContent Component
 * Main landing page for statements with sleek, professional UI
 * Features: animated header, advanced filters, search, infinite scroll table
 */

'use client';

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import { useStatementsListState } from './hooks/useStatementsListState';
import { StatementsTable } from './components/table/StatementsTable';
import { StatementDetailPanel } from './components/sidebar/StatementDetailPanel';
import { BulkDeleteModal } from '@/components/shared/modals/BulkDeleteModal';
import AdvancedFilters from '@/components/advancedFilters/AdvancedFilters';
import SortButton from '@/components/SortButton';
import { getStatementFilterOptions, getStatementSortOptions } from './config/filterConfig';
import { STATEMENT_TABLE_COLUMNS } from './config/columnConfig';
import { getQuickDateRange } from './utils';
import { ExportExcelButton, useEntityExport } from '@/components/shared/excel-export';
import { mapDataForExport } from '@/components/shared/excel-export/useListExport';
import type { QuickDatePreset } from '../types';
import type { RefObject } from 'react';
import { fetchStatementsWithPagination } from '@/components/statements/api/statementsApi';

// Quick date presets
const QUICK_DATE_PRESETS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'thisYear', label: 'This Year' },
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
};

export default function StatementsListContent() {
  const router = useRouter();

  // Navigation morph hooks
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'statements';

  // Main state
  const {
    // Data
    statements,
    allStatementsData,
    selectedStatement,
    setSelectedStatement,
    isLoadingDetails,

    // Loading
    isLoading,
    isSearching,
    error,
    refetch,

    // Pagination
    totalCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleScroll,

    // Search
    searchQuery,
    setSearchQuery,

    // Quick date
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,

    // Advanced filters & column filters
    activeFilters,
    columnFilters,
    handleServerFiltersChange,
    handleColumnFiltersChange,
    statementFilterOptions,
    serverFilters,

    // Sorting
    serverOrderBy,
    handleSortChange,

    // Selection
    selectedStatementIds,
    toggleStatementSelection,
    isItemSelected,
    isAllSelected,
    isPartiallySelected,
    handleSelectAll,
    handleSelectOne,
    selectedCount,
    clearSelection,
    getAllSelectedIds,

    // Bulk delete
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    handleBulkDeleteSuccess,
    clearAllFilters,
  } = useStatementsListState();

  // Local UI state
  const [showQuickPresetDropdown, setShowQuickPresetDropdown] = useState(false);

  // Excel export hook
  const { context: exportContext } = useEntityExport({
    data: allStatementsData as unknown as Record<string, unknown>[],
    activeFilters,
    columnFilters,
    quickDatePreset,
    quickDateField,
    sorting: serverOrderBy,
    searchQuery,
    config: {
      entityType: 'statements',
      columns: STATEMENT_TABLE_COLUMNS,
      getQuickDateRange: (preset: string) => getQuickDateRange(preset as QuickDatePreset),
      reportTitle: 'Statements Export',
    },
  });

  // Fetch ALL records for export (not just loaded via infinite scroll)
  const fetchAllStatementsForExport = useCallback(async () => {
    const quickFilters: { operator: 'GTE' | 'LTE'; columnName: string; value?: string }[] = [];
    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset as QuickDatePreset);
      if (start && end) {
        const columnName = quickDateField === 'createdAt' ? 'createdAt' : 'entityDate';
        const fmt = (d: Date) => columnName === 'entityDate'
          ? d.toISOString().split('T')[0]
          : `${d.toISOString().split('T')[0]} ${d.toTimeString().split(' ')[0]}`;
        quickFilters.push({ columnName, operator: 'GTE' as const, value: fmt(start) });
        quickFilters.push({ columnName, operator: 'LTE' as const, value: fmt(end) });
      }
    }
    const allFilters = [...quickFilters, ...serverFilters];

    const initial = await fetchStatementsWithPagination(allFilters, serverOrderBy, { limit: 1, offset: 0 });
    const total = initial.total;
    if (total === 0) return [];

    const result = await fetchStatementsWithPagination(allFilters, serverOrderBy, { limit: total, offset: 0 });
    return mapDataForExport(result.records as unknown as Record<string, unknown>[], STATEMENT_TABLE_COLUMNS);
  }, [quickDatePreset, quickDateField, serverFilters, serverOrderBy]);

  // Calculate totals
  const totals = useMemo(() => {
    const total = statements.reduce((sum, s) => sum + (s.total || 0), 0);
    const commission = statements.reduce((sum, s) => sum + (s.commission || 0), 0);
    return { total, commission };
  }, [statements]);

  // Filter and sort options
  const filterOptions = useMemo(() => getStatementFilterOptions(), []);
  const sortOptions = useMemo(() => getStatementSortOptions(), []);

  const activeSort = useMemo(() => {
    if (serverOrderBy && serverOrderBy.length > 0) {
      const first = serverOrderBy[0];
      return {
        columnName: first.columnName,
        direction: first.direction,
      } as { columnName: string; direction: 'ASC' | 'DESC' };
    }
    return undefined;
  }, [serverOrderBy]);

  // Check if there are any filters applied
  const hasFilters = useMemo(() => {
    const hasQuickDateFilter = quickDatePreset !== 'all';
    const hasAdvancedFilters = activeFilters.length > 0;
    const hasColumnFilters = Object.keys(columnFilters || {}).length > 0;
    const hasSearch = searchQuery.trim().length > 0;
    return hasQuickDateFilter || hasAdvancedFilters || hasColumnFilters || hasSearch;
  }, [quickDatePreset, activeFilters, columnFilters, searchQuery]);

  // Column header sort handler (single-column, toggles ASC/DESC) - same pattern as invoices
  const handleColumnSort = useCallback(
    (columnName: string) => {
      if (activeSort && activeSort.columnName === columnName) {
        // Toggle direction
        const newDirection = activeSort.direction === 'ASC' ? 'DESC' : 'ASC';
        handleSortChange({ columnName, direction: newDirection });
      } else {
        // New sort, default ASC
        handleSortChange({ columnName, direction: 'ASC' });
      }
    },
    [activeSort, handleSortChange]
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Page Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-sm relative z-30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Morphing Icon Target */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="stamp-press"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['statements']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-2xl font-bold text-gray-900"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Statements
              </motion.h1>
              <motion.p
                className="text-sm text-gray-500 mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                {searchQuery.length >= 2
                  ? `${statements.length} results for "${searchQuery}"`
                  : `Showing ${statements.length} of ${totalCount} statements`}
                {totals.total > 0 && (
                  <>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="font-medium text-gray-700">Total: {formatCurrency(totals.total)}</span>
                  </>
                )}
                {totals.commission > 0 && (
                  <>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="font-medium text-emerald-600">Commission: {formatCurrency(totals.commission)}</span>
                  </>
                )}
              </motion.p>
            </div>
          </div>

          {/* Top controls: search, filters, sort, create */}
          <motion.div
            className="flex items-center gap-3 flex-wrap justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            {/* Search */}
            <div className="relative w-72">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <circle cx="9" cy="9" r="6"/>
                <path d="M13.5 13.5L17 17" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search statements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              {isSearching && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-emerald-500" />
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
              filterOptions={filterOptions}
              activeFilters={activeFilters}
              onFiltersChange={handleServerFiltersChange}
            />

            {/* Sort Button */}
            <SortButton
              sortOptions={sortOptions}
              activeSort={activeSort}
              onSortChange={handleSortChange}
            />

            {/* Create Button */}
            <motion.button
              onClick={() => router.push('/statements/new')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-medium text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
              </svg>
              Create Statement
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white/60 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick filters label */}
          <span className="text-sm text-gray-500">
            Quick filters:
          </span>

          {/* Quick Date Filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 relative">
            {QUICK_DATE_PRESETS.slice(0, 5).map((preset) => (
              <button
                key={preset.value}
                onClick={() => setQuickDatePreset(preset.value as any)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  quickDatePreset === preset.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {/* "More" dropdown trigger */}
            {QUICK_DATE_PRESETS.length > 5 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQuickPresetDropdown((open) => !open)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/70 border border-gray-200 bg-white shadow-sm"
                >
                  <span>More</span>
                  <svg
                    width="12"
                    height="12"
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

                {showQuickPresetDropdown && (
                  <>
                    {/* Backdrop to close on outside click */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowQuickPresetDropdown(false)}
                    />
                    {/* Dropdown menu */}
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 min-w-[150px]">
                      {QUICK_DATE_PRESETS.slice(5).map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            setQuickDatePreset(preset.value as any);
                            setShowQuickPresetDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                            quickDatePreset === preset.value
                              ? 'bg-emerald-50 text-emerald-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="flex items-center justify-center w-9 h-9 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            title="Refresh"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>

          {/* Export to Excel */}
          <ExportExcelButton context={exportContext} options={{}} fetchAllData={fetchAllStatementsForExport} />
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl"
          >
            <span className="text-sm font-medium text-emerald-800">
              {selectedCount} statement{selectedCount > 1 ? 's' : ''} selected
            </span>
            <div className="flex-1" />
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Delete Selected
            </button>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 overflow-auto p-6 pb-0 transition-all duration-300 relative z-0 ${
          selectedStatement ? 'mr-[520px]' : ''
        }`}
        onScroll={handleScroll}
      >
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 flex-shrink-0">
              <circle cx="10" cy="10" r="8"/>
              <path d="M10 6v4M10 14v.01"/>
            </svg>
            <span className="text-sm text-red-700">{(error as Error).message}</span>
            <button
              onClick={() => refetch()}
              className="ml-auto px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100 rounded-lg transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Table */}
        <StatementsTable
          statements={statements}
          isLoading={isLoading}
          selectedStatementIds={selectedStatementIds}
          toggleStatementSelection={toggleStatementSelection}
          isItemSelected={isItemSelected}
          isAllSelected={isAllSelected}
          isPartiallySelected={isPartiallySelected}
          handleSelectAll={handleSelectAll}
          handleSelectOne={handleSelectOne}
          setSelectedStatement={setSelectedStatement}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          searchQuery={searchQuery}
          hasFilters={hasFilters}
          onClearFilters={clearAllFilters}
          onColumnFiltersChange={handleColumnFiltersChange}
          columnFilters={columnFilters}
          activeSort={activeSort}
          onSortChange={handleColumnSort}
        />

        {/* End of list */}
        {!hasNextPage && statements.length > 0 && !searchQuery && (
          <div className="text-center py-3 text-sm text-gray-400">
            All {totalCount} statements loaded
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <StatementDetailPanel
        statement={selectedStatement}
        onClose={() => setSelectedStatement(null)}
        isLoading={isLoadingDetails}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        entityType="STATEMENTS"
        selectedCount={selectedCount}
        getAllSelectedIds={getAllSelectedIds}
        onClose={() => setShowBulkDeleteModal(false)}
        onSuccess={handleBulkDeleteSuccess}
        queryKeysToInvalidate={[['statements'], ['statements-infinite']]}
      />
    </div>
  );
}
