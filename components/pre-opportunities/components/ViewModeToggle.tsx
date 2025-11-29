/**
 * View Mode Toggle Component
 * Toggles between Kanban and List views
 */

'use client';

import React from 'react';
import { BoardIcon, ListIcon } from './icons';
import type { ViewMode } from '../types';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  const baseButtonClass = 'px-3 py-1.5 rounded text-sm font-medium transition-colors';
  const activeClass = 'bg-white text-[var(--foreground)] shadow-sm';
  const inactiveClass = 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]';

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
      <button
        onClick={() => onViewModeChange('kanban')}
        className={`${baseButtonClass} ${viewMode === 'kanban' ? activeClass : inactiveClass}`}
      >
        <BoardIcon className="inline-block mr-1" />
        Board
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`${baseButtonClass} ${viewMode === 'list' ? activeClass : inactiveClass}`}
      >
        <ListIcon className="inline-block mr-1" />
        List
      </button>
    </div>
  );
}
