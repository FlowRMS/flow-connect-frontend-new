/**
 * Quick Filters Component
 * Quick filter buttons for Activity Feed: My Tasks, Today, Last Week, Created by Me
 */

import React from 'react';

export type QuickFilterType = 'myTasks' | 'today' | 'thisWeek' | 'lastWeek' | 'createdByMe';

interface QuickFiltersProps {
  activeFilters: QuickFilterType[];
  onToggleFilter: (filter: QuickFilterType) => void;
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

export function QuickFilters({ activeFilters, onToggleFilter }: QuickFiltersProps) {
  const filters: Array<{ type: QuickFilterType; label: string; shortLabel: string }> = [
    { type: 'today', label: 'Today', shortLabel: 'Today' },
    { type: 'thisWeek', label: 'This Week', shortLabel: 'This Wk' },
    { type: 'lastWeek', label: 'Last Week', shortLabel: 'Last Wk' },
    { type: 'createdByMe', label: 'Created by Me', shortLabel: 'Mine' },
    { type: 'myTasks', label: 'My Tasks', shortLabel: 'Tasks' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[var(--border)] overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
      {filters.map((filter) => {
        const isActive = activeFilters.includes(filter.type);
        return (
          <button
            key={filter.type}
            onClick={() => onToggleFilter(filter.type)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              isActive
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            <CheckboxIcon checked={isActive} />
            <span className="hidden xs:inline sm:inline">{filter.label}</span>
            <span className="xs:hidden sm:hidden">{filter.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
