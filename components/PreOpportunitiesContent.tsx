/**
 * Pre-Opportunities Content Component
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AdvancedFilters from './AdvancedFilters';
import { usePreOppsState } from './pre-opportunities/hooks/usePreOppsState';
import { getPreOppFilterOptions } from './pre-opportunities/config/filterConfig';
import { KanbanView } from './pre-opportunities/views/KanbanView';
import { ListView } from './pre-opportunities/views/ListView';
import { CreatePreOpportunityModal } from './pre-opportunities/modals/CreatePreOpportunityModal';

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
    statusCounts,
    activeId,
    setActiveId,
    activeFilter,
    setActiveFilter,
    uniqueEntityNumbers,
    uniqueStatuses,
    uniqueCreatedBy,
  } = usePreOppsState();

  const preOppFilterOptions = getPreOppFilterOptions(
    uniqueEntityNumbers,
    uniqueStatuses,
    uniqueCreatedBy
  );

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading pre-opportunities: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
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
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block mr-1">
                  <rect x="3" y="3" width="5" height="14"/>
                  <rect x="12" y="3" width="5" height="14"/>
                </svg>
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block mr-1">
                  <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
                </svg>
                List
              </button>
            </div>

            <AdvancedFilters 
              filterOptions={preOppFilterOptions}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              New Pre-Opportunity
            </button>
          </div>
        </div>
      </div>

      {/* Views */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-[var(--muted-foreground)]">Loading pre-opportunities...</div>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanView
          preOpps={preOpps}
          stages={stages}
          activeId={activeId}
          setActiveId={setActiveId}
          onRefresh={refetch}
        />
      ) : (
        <ListView 
          preOpps={preOpps} 
          onRefresh={refetch}
        />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreatePreOpportunityModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}
    </main>
  );
}

