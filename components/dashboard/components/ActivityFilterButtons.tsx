/**
 * Activity Filter Buttons Component
 */

import React from 'react';
import type { ActivityType } from '../types';
import { ACTIVITY_TYPE_LABELS, ALL_ACTIVITY_TYPES } from '../constants';

interface ActivityFilterButtonsProps {
  activeFilters: ActivityType[];
  onToggleFilter: (filter: ActivityType) => void;
  onSelectAll: () => void;
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

export function ActivityFilterButtons({ activeFilters, onToggleFilter, onSelectAll }: ActivityFilterButtonsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[var(--border)] overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
      <button
        onClick={onSelectAll}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-[var(--primary)] text-white hover:opacity-90 whitespace-nowrap flex-shrink-0"
      >
        Select All
      </button>
      {ALL_ACTIVITY_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onToggleFilter(type)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            activeFilters.includes(type)
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
          }`}
        >
          <CheckboxIcon checked={activeFilters.includes(type)} />
          <span className="hidden xs:inline sm:inline">{ACTIVITY_TYPE_LABELS[type]}</span>
          <span className="xs:hidden sm:hidden">{ACTIVITY_TYPE_LABELS[type].charAt(0)}</span>
        </button>
      ))}
    </div>
  );
}
