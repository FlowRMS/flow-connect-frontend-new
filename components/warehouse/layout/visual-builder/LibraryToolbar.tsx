'use client';

import React from 'react';
import { LevelIcons, levelColors } from '../constants';

interface LibraryToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onDragStart: (type: string) => void;
}

export default function LibraryToolbar({ zoom, onZoomIn, onZoomOut, onResetView, onDragStart }: LibraryToolbarProps) {
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(type);
  };

  return (
    <div className="absolute left-4 top-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[var(--border)] p-3">
      <div className="text-xs font-semibold text-[var(--foreground)] mb-2">Library</div>

      {/* Draggable Section */}
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, 'section')}
        className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg cursor-move bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        <span className="text-purple-600 dark:text-purple-400">{LevelIcons.section}</span>
        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Section</span>
      </div>

      <div className="h-px bg-[var(--border)] my-3" />

      {/* Zoom Controls */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-medium text-[var(--muted-foreground)] mb-1">View</div>
        <button
          onClick={onZoomIn}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-[var(--accent)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
          Zoom In
        </button>
        <button
          onClick={onZoomOut}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-[var(--accent)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6" />
          </svg>
          Zoom Out
        </button>
        <button
          onClick={onResetView}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-[var(--accent)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset
        </button>
        <div className="text-center text-[10px] text-[var(--muted-foreground)] mt-1">{Math.round(zoom * 100)}%</div>
      </div>
    </div>
  );
}
