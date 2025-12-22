/**
 * NotesTab Component
 * Displays internal notes for the invoice
 */

'use client';

import React from 'react';

interface NotesTabProps {
  // TODO: Add props for notes data when implementing real functionality
}

export function NotesTab({}: NotesTabProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Notes
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Internal notes for this invoice
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium">
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 5v10M5 10h10" strokeLinecap="round" />
          </svg>
          Add Note
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
              SC
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)]">
                  Sarah Chen
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Mar 20, 2024 at 2:34 PM
                </span>
              </div>
              <p className="text-sm text-[var(--foreground)] mt-1">
                Customer requested extended payment terms. Approved 45 days net
                instead of 30.
              </p>
            </div>
            <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="text-[var(--muted-foreground)]"
              >
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
              MT
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)]">
                  Mike Torres
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Mar 18, 2024 at 4:15 PM
                </span>
              </div>
              <p className="text-sm text-[var(--foreground)] mt-1">
                Partial payment received. Remaining balance to be collected next
                month.
              </p>
            </div>
            <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="text-[var(--muted-foreground)]"
              >
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

