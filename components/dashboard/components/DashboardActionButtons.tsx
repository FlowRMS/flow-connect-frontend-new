/**
 * Dashboard Action Buttons Component
 */

import React from 'react';

interface DashboardActionButtonsProps {
  onAddJob: () => void;
  onCreatePreOpportunity: () => void;
  onAddTask: () => void;
  onCreateNote: () => void;
}

export function DashboardActionButtons({
  onAddJob,
  onCreatePreOpportunity,
  onAddTask,
  onCreateNote,
}: DashboardActionButtonsProps) {
  return (
    <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
      <button 
        onClick={onAddJob}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
      >
        <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="7"/>
          <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
        </svg>
        <span className="hidden sm:inline">Add Job</span>
        <span className="sm:hidden">Job</span>
      </button>
      <button 
        onClick={onCreatePreOpportunity}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[var(--info)] text-white rounded-lg font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity"
      >
        <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 10h4M10 8v4M17 10A7 7 0 103 10a7 7 0 0014 0z" strokeLinecap="round"/>
        </svg>
        <span className="hidden sm:inline">Create Pre-Opportunity</span>
        <span className="sm:hidden">Pre-Opp</span>
      </button>
      <button 
        onClick={onAddTask}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 10h10M3 6h14M7 14h6" strokeLinecap="round"/>
        </svg>
        <span className="hidden sm:inline">Add Task</span>
        <span className="sm:hidden">Task</span>
      </button>
      <button 
        onClick={onCreateNote}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="hidden sm:inline">Create Note</span>
        <span className="sm:hidden">Note</span>
      </button>
    </div>
  );
}
