'use client';

import React from 'react';
import type { ViewMode } from '../types';
import ViewModeToggle from './ViewModeToggle';
import { countLocations } from '../utils';
import type { WarehouseLocation } from '../types';

interface ModalHeaderProps {
  warehouseName: string;
  viewMode: ViewMode;
  locations: WarehouseLocation[];
  onViewModeChange: (mode: ViewMode) => void;
  onClose: () => void;
}

export default function ModalHeader({ warehouseName, viewMode, locations, onViewModeChange, onClose }: ModalHeaderProps) {
  const locationCount = countLocations(locations);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0 bg-[var(--card)]">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="w-px h-6 bg-[var(--border)]" />

        {/* Title */}
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Warehouse Layout</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {warehouseName} •{' '}
            {viewMode === 'tree' ? 'Click names to edit, drag to reorder' : 'Drag from library, double-click to view hierarchy'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      {/* Location Count */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--muted-foreground)]">{locationCount} locations</span>
      </div>
    </div>
  );
}
