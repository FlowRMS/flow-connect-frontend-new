/**
 * Email Ingestion Content Component - Main Container
 * Clean, modular implementation with separated concerns
 */

'use client';

import React from 'react';
import SettingsButton from '../SettingsButton';
import ComingSoonOverlay from '../ComingSoonOverlay';
import { useEmailsState } from './hooks/useEmailsState';
import { CardView } from './views/CardView';
import { SpreadsheetView } from './views/SpreadsheetView';
import { EmailDetailModal } from './detail/EmailDetailModal';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import type { FilterStatus } from './types';

export default function EmailIngestionContent() {
  const {
    viewMode,
    setViewMode,
    selectedStatus,
    setSelectedStatus,
    selectedEmailId,
    setSelectedEmailId,
    emails,
    filteredEmails,
    statusCounts,
    handleProcessEmail,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEmailsState();

  // Infinite scroll
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  const selectedEmail = selectedEmailId
    ? emails.find(e => e.id === selectedEmailId)
    : null;

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6 relative">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">Email Ingestion</h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
              Review and process incoming emails
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'card' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Card View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('spreadsheet')}
                className={`hidden sm:block p-1.5 sm:p-2 rounded ${viewMode === 'spreadsheet' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Spreadsheet View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <button className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
              </svg>
              Filter
            </button>
            <button className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <SettingsButton />
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-4 border-b border-[var(--border)] pb-2 overflow-x-auto">
        <div className="flex gap-1 sm:gap-2">
          {(['All', 'Needs Attention', 'Processed'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                selectedStatus === status
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              {status === 'Needs Attention' ? <span className="sm:hidden">Attention</span> : null}
              {status === 'Needs Attention' ? <span className="hidden sm:inline">{status}</span> : status}
              <span className="ml-1 sm:ml-2 text-xs opacity-75">
                ({status === 'All'
                  ? statusCounts.all
                  : status === 'Processed'
                  ? statusCounts.processed
                  : statusCounts.needsAttention})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--primary)] border-r-transparent"></div>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">Loading emails...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Failed to Load Emails</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Views */}
      {!isLoading && !error && (
        <>
          {viewMode === 'card' ? (
            <CardView
              emails={filteredEmails}
              onEmailClick={setSelectedEmailId}
              onProcessEmail={handleProcessEmail}
            />
          ) : (
            <SpreadsheetView
              emails={filteredEmails}
              onEmailClick={setSelectedEmailId}
              onProcessEmail={handleProcessEmail}
            />
          )}

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="h-4" />

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500">Loading more emails...</span>
            </div>
          )}

          {/* End of list indicator */}
          {!hasNextPage && filteredEmails.length > 0 && (
            <div className="text-center py-4 text-sm text-gray-400">
              All emails loaded
            </div>
          )}
        </>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmailId(null)}
          onProcessEmail={handleProcessEmail}
        />
      )}
    </main>
  );
}
