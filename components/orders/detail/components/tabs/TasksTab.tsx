/**
 * TasksTab Component
 * Displays tasks for the order
 */

'use client';

import React from 'react';

export function TasksTab() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Tasks</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Track action items and follow-ups for this order</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
          </svg>
          Add Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {/* Overdue Task */}
        <div className="bg-[var(--card)] border-l-4 border-l-red-500 border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-[var(--border)]" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)]">Follow up with Turner Construction</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Overdue</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Confirm approval timeline for Lutron fixtures
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                <span>Due: Mar 25, 2024</span>
                <span>Assigned: Sarah Chen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Due Soon Task */}
        <div className="bg-[var(--card)] border-l-4 border-l-yellow-500 border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-[var(--border)]" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)]">Send revised pricing to customer</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Due Soon</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Include updated overage calculations
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                <span>Due: Mar 28, 2024</span>
                <span>Assigned: Mike Torres</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Task */}
        <div className="bg-[var(--card)] border-l-4 border-l-green-500 border border-[var(--border)] rounded-lg p-4 opacity-75">
          <div className="flex items-start gap-3">
            <input type="checkbox" checked className="mt-1 w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)]" readOnly />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--foreground)] line-through">Submit approval request to Philips</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Completed</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1 line-through">
                Request approval for LED panels
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
