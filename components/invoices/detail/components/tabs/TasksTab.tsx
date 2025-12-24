/**
 * TasksTab Component
 * Displays tasks and action items for the invoice
 */

'use client';

import React from 'react';

interface TasksTabProps {
  // TODO: Add props for tasks data when implementing real functionality
}

export function TasksTab({}: TasksTabProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Tasks
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Track action items and follow-ups for this invoice
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
          Add Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {/* Overdue Task */}
        <div className="bg-[var(--card)] border-l-4 border-l-red-500 border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-[var(--border)]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)]">
                  Follow up on payment
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                  Overdue
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Contact accounts payable for outstanding balance
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                <span>Due: Mar 25, 2024</span>
                <span>Assigned: Sarah Chen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Task */}
        <div className="bg-[var(--card)] border-l-4 border-l-green-500 border border-[var(--border)] rounded-lg p-4 opacity-75">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked
              className="mt-1 w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)]"
              readOnly
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)] line-through">
                  Send invoice to customer
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  Completed
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1 line-through">
                Email invoice PDF to billing contact
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

