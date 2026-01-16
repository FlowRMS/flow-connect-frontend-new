/**
 * Reusable Sort Indicator Component
 * Displays sort arrows in table headers
 */

'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ActiveSort } from '../types';

interface SortIndicatorProps {
  columnId: string;
  activeSort: ActiveSort | null;
  onSort: (columnId: string) => void;
  isFetching?: boolean; // Optional: show loading state
}

export function SortIndicator({
  columnId,
  activeSort,
  onSort,
  isFetching = false,
}: SortIndicatorProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSort(columnId);
  };

  const isActive = activeSort?.columnId === columnId;
  const isFetchingThisColumn = isFetching && isActive;

  if (!isActive) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center justify-center hover:opacity-100 transition-opacity"
      >
        <ArrowUpDown className="w-4 h-4 opacity-50" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center hover:opacity-80 transition-opacity relative"
      disabled={isFetchingThisColumn}
    >
      {isFetchingThisColumn ? (
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        activeSort.direction === 'ASC' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )
      )}
    </button>
  );
}

