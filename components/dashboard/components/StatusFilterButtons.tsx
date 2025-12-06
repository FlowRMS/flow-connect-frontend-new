/**
 * Status Filter Buttons Component
 */

import React from 'react';
import type { ActivityStatus } from '../types';
import { capitalize } from '../utils';

interface StatusFilterButtonsProps {
  statusFilters: ActivityStatus[];
  onToggleStatusFilter: (status: ActivityStatus) => void;
}

interface CheckboxIconProps {
  checked: boolean;
}

function CheckboxIcon({ checked }: CheckboxIconProps) {
  return (
    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
      checked ? 'border-white bg-white' : 'border-[var(--border)]'
    }`}>
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--primary)" strokeWidth="2">
          <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

export function StatusFilterButtons({ statusFilters, onToggleStatusFilter }: StatusFilterButtonsProps) {
  const statuses: ActivityStatus[] = ['upcoming', 'completed'];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => onToggleStatusFilter(status)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors border whitespace-nowrap ${
            statusFilters.includes(status)
              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
              : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
          }`}
        >
          <CheckboxIcon checked={statusFilters.includes(status)} />
          <span className="hidden sm:inline">{capitalize(status)}</span>
          <span className="sm:hidden">{status === 'upcoming' ? 'Up' : 'Done'}</span>
        </button>
      ))}
    </div>
  );
}
