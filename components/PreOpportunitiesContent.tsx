/**
 * Pre-Opportunities Content Component
 * Main entry point for the Pre-Opportunities page
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import AdvancedFilters from './AdvancedFilters';
import SortButton from './SortButton';
import {
  usePreOppsState,
  getPreOppFilterOptions,
  getPreOppSortOptions,
  KanbanView,
  ListView,
  CreatePreOpportunityModal,
  ViewModeToggle,
  LoadingState,
  ErrorState,
  PlusCircleIcon,
} from './pre-opportunities';

export default function PreOpportunitiesContent() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    viewMode,
    setViewMode,
    preOpps,
    isLoading,
    error,
    refetch,
    stages,
    activeId,
    setActiveId,
    activeFilters,
    clientSortColumns,
    uniqueEntityNumbers,
    uniqueStatuses,
    uniqueCreatedBy,
    handleFiltersChange,
    handleMultiSortChange,
  } = usePreOppsState();

  const preOppFilterOptions = useMemo(() => getPreOppFilterOptions(
    uniqueEntityNumbers,
    uniqueStatuses,
    uniqueCreatedBy
  ), [uniqueEntityNumbers, uniqueStatuses, uniqueCreatedBy]);

  const preOppSortOptions = useMemo(() => getPreOppSortOptions(), []);

  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setIsCreateModalOpen(false);
    refetch();
  }, [refetch]);

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Pre-Opportunities</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {isLoading ? 'Loading...' : `${preOpps.length} opportunities`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

            <SortButton
              sortOptions={preOppSortOptions}
              onMultiSortChange={handleMultiSortChange}
              activeSorts={clientSortColumns}
            />

            <AdvancedFilters
              filterOptions={preOppFilterOptions}
              activeFilters={activeFilters}
              onFiltersChange={handleFiltersChange}
            />

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <PlusCircleIcon />
              New Pre-Opportunity
            </button>
          </div>
        </div>
      </div>

      {/* Views */}
      {isLoading ? (
        <LoadingState />
      ) : viewMode === 'kanban' ? (
        <KanbanView
          preOpps={preOpps}
          stages={stages}
          activeId={activeId}
          setActiveId={setActiveId}
          onRefresh={refetch}
        />
      ) : (
        <ListView preOpps={preOpps} onRefresh={refetch} />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreatePreOpportunityModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onSuccess={handleCreateSuccess}
        />
      )}
    </main>
  );
}

