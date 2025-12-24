/**
 * ActivityTab Component
 * Displays activity feed for the invoice
 */

'use client';

import React from 'react';

interface ActivityTabProps {
  // TODO: Add props for activity data when implementing real functionality
}

export function ActivityTab({}: ActivityTabProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Activity Feed
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            All activity and changes on this invoice
          </p>
        </div>
        <select className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]">
          <option>All Activity</option>
          <option>Payments</option>
          <option>Status Changes</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {/* Payment Received */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-green-600"
              >
                <path
                  d="M10 4v12M6 8l4-4 4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)]">
                  Payment received
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Mar 22, 2024 at 10:15 AM
                </span>
              </div>
              <p className="text-sm text-[var(--foreground)] mt-1">
                Partial payment of $5,000.00 received via ACH
              </p>
            </div>
          </div>
        </div>

        {/* Status Changed */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-600"
              >
                <path
                  d="M4 4h12v12H4V4z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M4 8h12M8 4v12" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)]">
                  Status changed
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Mar 18, 2024 at 3:45 PM
                </span>
              </div>
              <p className="text-sm text-[var(--foreground)] mt-1">
                Status changed from &quot;Open&quot; to &quot;Partial Paid&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Created */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-purple-600"
              >
                <path
                  d="M4 4h12v12H4V4z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M4 8h12M8 4v12" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)]">
                  Invoice created
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Mar 15, 2024 at 9:30 AM
                </span>
              </div>
              <p className="text-sm text-[var(--foreground)] mt-1">
                Invoice INV-001234 created from Order ORD-005678
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

