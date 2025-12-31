/**
 * CommissionsListContent Component
 * Main container for commissions list
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCommissionsListState } from './hooks/useCommissionsListState';
import { CommissionsTable } from './components/table/CommissionsTable';
import { QuickDateFilter } from './components/QuickDateFilter';
import { CheckDetailPanel } from './components/sidebar/CheckDetailPanel';

export default function CommissionsListContent() {
  const router = useRouter();
  const state = useCommissionsListState();

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${state.selectedCheck ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
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
                    {state.checks.length} checks
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
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

          {/* Quick Date Filter */}
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
        <div className="flex-1 overflow-auto p-6 pt-4">
          <CommissionsTable
            filteredChecks={state.filteredChecks}
            selectedCheckIds={state.selectedCheckIds}
            toggleCheckSelection={state.toggleCheckSelection}
            selectAllChecks={state.selectAllChecks}
            clearSelection={state.clearSelection}
            areAllEligibleSelected={state.areAllEligibleSelected}
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
            bulkDelete={state.bulkDelete}
            setSelectedCheck={state.setSelectedCheck}
          />
        </div>
      </div>

      {/* Sidebar */}
      {state.selectedCheck && (
        <CheckDetailPanel
          check={state.selectedCheck}
          onClose={() => state.setSelectedCheck(null)}
        />
      )}
    </main>
  );
}

