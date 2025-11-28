/**
 * Pre-Opportunities Content Component
 */

'use client';

import React from 'react';
import AdvancedFilters from './AdvancedFilters';
import { usePreOppsState } from './pre-opportunities/hooks/usePreOppsState';
import { getPreOppFilterOptions } from './pre-opportunities/config/filterConfig';
import { KanbanView } from './pre-opportunities/views/KanbanView';
import { ListView } from './pre-opportunities/views/ListView';

export default function PreOpportunitiesContent() {
  const {
    viewMode,
    setViewMode,
    preOpps,
    setPreOpps,
    stages,
    activeId,
    setActiveId,
    activeFilter,
    setActiveFilter,
    uniquePreOppNames,
    uniqueStages,
    uniqueJobs,
    uniqueSoldTo,
    uniqueManufacturers,
    uniqueOwners,
    uniqueTags,
  } = usePreOppsState();

  const preOppFilterOptions = getPreOppFilterOptions(
    uniquePreOppNames,
    uniqueStages,
    uniqueJobs,
    uniqueSoldTo,
    uniqueManufacturers,
    uniqueOwners,
    uniqueTags
  );

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Pre-Opportunities</h1>
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

            <AdvancedFilters filterOptions={preOppFilterOptions} />

            <button className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6l7 7 7-7" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              Add Pre-Opportunity
            </button>
          </div>
        </div>
      </div>

      {/* Views */}
      {viewMode === 'kanban' ? (
        <KanbanView
          preOpps={preOpps}
          setPreOpps={setPreOpps}
          stages={stages}
          activeId={activeId}
          setActiveId={setActiveId}
        />
      ) : (
        <ListView preOpps={preOpps} />
      )}
    </main>
  );
}
