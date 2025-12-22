/**
 * SortIcon Component
 * Visual indicator for sortable columns
 */

import type { SortField, SortDirection } from '../../types';

interface SortIconProps {
  field: SortField;
  currentSortField: SortField;
  currentSortDirection: SortDirection;
}

export function SortIcon({
  field,
  currentSortField,
  currentSortDirection,
}: SortIconProps) {
  const isActive = currentSortField === field;

  return (
    <span className="ml-1 inline-flex flex-col">
      {/* Up arrow */}
      <svg
        className={`w-2 h-2 ${
          isActive && currentSortDirection === 'asc'
            ? 'text-[var(--primary)]'
            : 'text-[var(--muted-foreground)]/50'
        }`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      {/* Down arrow */}
      <svg
        className={`w-2 h-2 -mt-0.5 ${
          isActive && currentSortDirection === 'desc'
            ? 'text-[var(--primary)]'
            : 'text-[var(--muted-foreground)]/50'
        }`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 4L0 0H8L4 4Z" />
      </svg>
    </span>
  );
}

