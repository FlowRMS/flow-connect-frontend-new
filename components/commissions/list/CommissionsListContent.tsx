/**
 * CommissionsListContent Component
 * Main container for commissions list
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import AdvancedFilters from '@/components/advancedFilters/AdvancedFilters';
import SortButton from '@/components/SortButton';
import { useCommissionsListState } from './hooks/useCommissionsListState';
import { getCommissionFilterOptions, getCommissionSortOptions } from './config/filterConfig';
import { CommissionsTable } from './components/table/CommissionsTable';
import { QuickDateFilter } from './components/QuickDateFilter';
import { CheckDetailPanel } from './components/sidebar/CheckDetailPanel';
import { BulkDeleteModal } from '@/components/shared/modals/BulkDeleteModal';

export default function CommissionsListContent() {
  const router = useRouter();
  const state = useCommissionsListState();
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

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

  const isReceivingAnimation = floatingIcon?.itemId === 'commissions';

  // Filter and sort options
  const filterOptions = getCommissionFilterOptions();
  const sortOptions = getCommissionSortOptions();

  // Map sortField and sortDirection to ActiveSort format for SortButton (for backwards compatibility)
  // The columnName should match API field names directly
  const activeSort = state.sortField && state.sortDirection
    ? {
        columnName: (() => {
          const fieldMap: Record<string, string> = {
            checkNumber: 'checkNumber',
            status: 'status',
            netAmount: 'enteredCommissionAmount',
            commissionMonth: 'commissionMonth',
            manufacturerName: 'factoryName',
            postDate: 'postDate',
            checkDate: 'checkDate',
            entryDate: 'createdAt',
            checkBalance: 'enteredCommissionAmount',
          };
          return fieldMap[state.sortField] || 'createdAt';
        })(),
        direction: state.sortDirection.toUpperCase() as 'ASC' | 'DESC',
      }
    : undefined;

  // Map serverOrderBy to ActiveSort[] format for multi-sort support
  const activeSorts = state.serverOrderBy.map(orderBy => ({
    columnName: orderBy.columnName,
    direction: orderBy.direction,
  }));

  // Handler to open bulk delete modal instead of using confirm dialog
  const handleBulkDelete = () => {
    if (state.selectedCount === 0) return;
    setShowBulkDeleteModal(true);
  };

  // Handler for successful bulk delete
  const handleBulkDeleteSuccess = () => {
    state.clearSelection();
    state.refetchChecks();
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${state.selectedCheck ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-start gap-4">
              {/* Morphing Icon Target - Coin Cascade Animation */}
              <HeaderIconAnimation
                isReceivingAnimation={isReceivingAnimation}
                animationStyle="coin-cascade"
                headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
              >
                {iconMap['commissions']}
              </HeaderIconAnimation>
              <div className="overflow-hidden">
                <motion.h1
                  className="text-2xl font-semibold text-[var(--foreground)]"
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
                >
                  Commission Check
                </motion.h1>
                <motion.p
                  className="text-sm text-[var(--muted-foreground)] mt-1"
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
                >
                  {state.totalCount > 0 ? `${state.checks.length} of ${state.totalCount} checks` : `${state.checks.length} checks`}
                </motion.p>
              </div>
            </div>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
            >
              <AdvancedFilters
                filterOptions={filterOptions}
                onFiltersChange={state.handleServerFiltersChange}
                activeFilters={state.activeFilters}
              />
              <SortButton
                sortOptions={sortOptions}
                activeSort={activeSort}
                activeSorts={activeSorts}
                onSortChange={state.handleSortChange}
                onMultiSortChange={state.handleMultiSortChange}
              />
              <div className="relative group">
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  Coming Soon
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
              <button
                onClick={() => router.push('/commissions/new')}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="10" cy="10" r="7" />
                  <path d="M10 7v6M7 10h6" strokeLinecap="round" />
                </svg>
                Add new Check
              </button>
            </motion.div>
          </div>

          {/* Quick Date Filter */}
          <div className="mt-4">
            <QuickDateFilter
              quickDatePreset={state.quickDatePreset}
              setQuickDatePreset={state.setQuickDatePreset}
              quickDateField={state.quickDateField}
              setQuickDateField={state.setQuickDateField}
              showQuickDateFieldDropdown={state.showQuickDateFieldDropdown}
              setShowQuickDateFieldDropdown={state.setShowQuickDateFieldDropdown}
            />
          </div>
        </div>

        {/* Commissions Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <CommissionsTable
            filteredChecks={state.checks}
            isLoading={state.isLoadingChecks}
            selectedCheckIds={state.selectedCheckIds}
            toggleCheckSelection={state.toggleCheckSelection}
            selectAllChecks={state.selectAllChecks}
            clearSelection={state.clearSelection}
            areAllEligibleSelected={state.areAllEligibleSelected}
            isItemSelected={state.isItemSelected}
            isAllSelected={state.isAllSelected}
            isPartiallySelected={state.isPartiallySelected}
            handleSelectAll={state.handleSelectAll}
            handleSelectOne={state.handleSelectOne}
            sortField={state.sortField}
            sortDirection={state.sortDirection}
            handleSort={state.handleSort}
            columnFilters={state.columnFilters}
            onColumnFiltersChange={state.handleColumnFiltersChange}
            filterOptions={filterOptions}
            showBulkActionsMenu={state.showBulkActionsMenu}
            setShowBulkActionsMenu={state.setShowBulkActionsMenu}
            bulkSetStatus={state.bulkSetStatus}
            bulkDelete={handleBulkDelete}
            setSelectedCheck={state.setSelectedCheck}
            isBulkUpdating={state.isBulkUpdating}
            hasNextPage={state.hasNextPage}
            isFetchingNextPage={state.isFetchingNextPage}
            fetchNextPage={state.fetchNextPage}
          />
          {/* Infinite Scroll Loading Indicator */}
          {state.isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)] mr-2" />
              <span className="text-sm text-[var(--muted-foreground)]">Loading more checks...</span>
            </div>
          )}
          {/* End of List Indicator */}
          {!state.hasNextPage && state.checks.length > 0 && (
            <div className="text-center py-4 text-sm text-[var(--muted-foreground)]">
              All {state.totalCount} checks loaded
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {state.selectedCheck && (
        <CheckDetailPanel
          check={state.selectedCheck}
          onClose={() => state.setSelectedCheck(null)}
          onPostCheck={state.handlePostCheck}
          onUnpostCheck={state.handleUnpostCheck}
          isUpdating={state.isUpdatingCheck}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        entityType="CHECKS"
        selectedCount={state.selectedCount}
        getAllSelectedIds={state.getAllSelectedIds}
        onClose={() => setShowBulkDeleteModal(false)}
        onSuccess={handleBulkDeleteSuccess}
        queryKeysToInvalidate={[['checksLandingPage'], ['checksInfinite'], ['checkSearch']]}
      />
    </main>
  );
}
