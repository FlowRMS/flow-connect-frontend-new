/**
 * Email Ingestion Content Component - Main Container
 * Clean, modular implementation with separated concerns
 */

'use client';

import React from 'react';
import SettingsButton from '../SettingsButton';
import { useEmailsState } from './hooks/useEmailsState';
import { CardView } from './views/CardView';
import { SpreadsheetView } from './views/SpreadsheetView';
import { EmailDetailModal } from './detail/EmailDetailModal';
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
  } = useEmailsState();

  const selectedEmail = selectedEmailId
    ? emails.find(e => e.id === selectedEmailId)
    : null;

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Email Ingestion</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Review and process incoming emails with automated entity detection
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded ${viewMode === 'card' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Card View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('spreadsheet')}
                className={`p-2 rounded ${viewMode === 'spreadsheet' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Spreadsheet View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
              </svg>
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <SettingsButton />
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="mb-6 flex items-center gap-4 border-b border-[var(--border)] pb-2">
        <div className="flex gap-2">
          {(['All', 'Needs Attention', 'Processed'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                selectedStatus === status
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              {status}
              <span className="ml-2 text-xs opacity-75">
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

      {/* Views */}
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
