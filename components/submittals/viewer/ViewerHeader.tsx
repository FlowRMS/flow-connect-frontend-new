'use client';

import React from 'react';

interface ViewerHeaderProps {
  manufacturer: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClose: () => void;
}

export function ViewerHeader({
  manufacturer,
  zoom,
  onZoomIn,
  onZoomOut,
  onClose,
}: ViewerHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Spec Sheet Viewer
        </h2>
        <span className="text-sm text-[var(--muted-foreground)]">
          {manufacturer}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--muted)] rounded-lg">
          <button
            onClick={onZoomOut}
            className="p-1 hover:bg-[var(--background)] rounded transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 10h10" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-sm text-[var(--foreground)] w-12 text-center">{zoom}%</span>
          <button
            onClick={onZoomIn}
            className="p-1 hover:bg-[var(--background)] rounded transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
