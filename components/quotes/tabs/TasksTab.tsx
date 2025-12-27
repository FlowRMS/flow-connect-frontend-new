'use client';

import React from 'react';

export function TasksTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Tasks</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Track action items and follow-ups for this quote</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
          </svg>
          Add Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {/* Overdue Task */}
        <div className="bg-[var(--card)] rounded-lg border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 accent-[var(--primary)]" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-[var(--foreground)]">Follow up with Turner Construction</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">Overdue</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Confirm approval timeline for Lutron fixtures</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                <span>Due: Mar 25, 2024</span>
                <span>Assigned: Sarah Chen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Task */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 accent-[var(--primary)]" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-[var(--foreground)]">Send revised pricing to customer</span>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Due Soon</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Include updated overage calculations</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                <span>Due: Mar 28, 2024</span>
                <span>Assigned: Mike Torres</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Task */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 opacity-60">
          <div className="flex items-start gap-3">
            <input type="checkbox" checked className="mt-1 accent-[var(--primary)]" readOnly />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-[var(--foreground)] line-through">Submit approval request to Philips</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Completed</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Request approval for LED panels</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                <span>Completed: Mar 20, 2024</span>
                <span>By: Sarah Chen</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
