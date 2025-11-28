/**
 * Dashboard Action Buttons Component
 */

import React from 'react';

export function DashboardActionButtons() {
  return (
    <div className="flex gap-3 mb-6">
      <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="7"/>
          <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
        </svg>
        Add Job
      </button>
      <button className="flex items-center gap-2 px-4 py-2 bg-[var(--info)] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 10h4M10 8v4M17 10A7 7 0 103 10a7 7 0 0014 0z" strokeLinecap="round"/>
        </svg>
        Create Pre-Opportunity
      </button>
      <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 10h10M3 6h14M7 14h6" strokeLinecap="round"/>
        </svg>
        Add Task
      </button>
      <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Create Note
      </button>
    </div>
  );
}
