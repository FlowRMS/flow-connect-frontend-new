/**
 * CommissionsListContent Component
 * Main container for commissions list
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdvancedFilters from '@/components/advancedFilters/AdvancedFilters';
import { useCommissionsListState } from './hooks/useCommissionsListState';
import { getCommissionFilterOptions } from './config/filterConfig';
import { CommissionsTable } from './components/table/CommissionsTable';
import { QuickDateFilter } from './components/QuickDateFilter';
import { CheckDetailPanel } from './components/sidebar/CheckDetailPanel';
import { BulkDeleteModal } from '@/components/shared/modals/BulkDeleteModal';

export default function CommissionsListContent() {
  const router = useRouter();
  const state = useCommissionsListState();
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const filterOptions = getCommissionFilterOptions();

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
        <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M6 9h4M6 13h12" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[var(--foreground)]">
                    Commission Check
                  </h1>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {state.totalCount > 0 ? `${state.checks.length} of ${state.totalCount} checks` : `${state.checks.length} checks`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AdvancedFilters
                filterOptions={filterOptions}
                onFiltersChange={state.handleServerFiltersChange}
                activeFilters={state.activeFilters}
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
            </div>
          </div>
        </div>
        {/* Quick Date Filter */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
          <QuickDateFilter
            quickDatePreset={state.quickDatePreset}
            setQuickDatePreset={state.setQuickDatePreset}
            quickDateField={state.quickDateField}
            setQuickDateField={state.setQuickDateField}
            showQuickDateFieldDropdown={state.showQuickDateFieldDropdown}
            setShowQuickDateFieldDropdown={state.setShowQuickDateFieldDropdown}
          />
        </div>

        {/* Commissions Table */}
        <div className="flex-1 overflow-auto p-6 pt-4" onScroll={state.handleScroll}>
          <CommissionsTable
            filteredChecks={state.filteredChecks}
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
            setColumnFilters={state.setColumnFilters}
            openFilter={state.openFilter}
            setOpenFilter={state.setOpenFilter}
            uniqueStatuses={state.uniqueStatuses}
            uniqueManufacturers={state.uniqueManufacturers}
            showBulkActionsMenu={state.showBulkActionsMenu}
            setShowBulkActionsMenu={state.setShowBulkActionsMenu}
            bulkSetStatus={state.bulkSetStatus}
            bulkDelete={handleBulkDelete}
            setSelectedCheck={state.setSelectedCheck}
            isBulkUpdating={state.isBulkUpdating}
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

