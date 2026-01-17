'use client';

import React from 'react';
import type { HighlightShape } from '../../../../lib/types/submittals';
import { ChevronIcon } from './icons';

interface ToolsSectionProps {
  activeTool: HighlightShape | 'select';
  setActiveTool: (tool: HighlightShape | 'select') => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  hasUnsavedChanges: boolean;
  drawingRegionsCount: number;
  onClearDrawing: () => void;
  onUpdateVersion: () => void;
  expanded: boolean;
  onToggle: () => void;
}

const COLORS = ['#FFEB3B', '#FF5722', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0'];
const COLOR_NAMES: Record<string, string> = {
  '#FFEB3B': 'Yellow',
  '#FF5722': 'Orange',
  '#4CAF50': 'Green',
  '#2196F3': 'Blue',
  '#E91E63': 'Pink',
  '#9C27B0': 'Purple',
};

export function ToolsSection({
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  hasUnsavedChanges,
  drawingRegionsCount,
  onClearDrawing,
  onUpdateVersion,
  expanded,
  onToggle,
}: ToolsSectionProps) {
  return (
    <div className="border-b border-[var(--border)]">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors"
      >
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Highlight Tools</h3>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)] w-12">Tool:</span>
            <div className="flex gap-1 flex-1">
              <button
                onClick={() => setActiveTool('select')}
                className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1 ${
                  activeTool === 'select'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                }`}
                title="Select, move, and resize highlights"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                </svg>
                Select
              </button>
              {(['rectangle', 'oval'] as HighlightShape[]).map(tool => (
                <button
                  key={tool}
                  onClick={() => setActiveTool(tool)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded capitalize transition-colors ${
                    activeTool === tool
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-[var(--muted-foreground)] mb-2 block">Color:</span>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`w-8 h-8 rounded-full transition-all border-2 ${
                    activeColor === color
                      ? 'ring-2 ring-offset-2 ring-[var(--primary)] border-white shadow-lg scale-110'
                      : 'border-gray-200 hover:scale-105 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={COLOR_NAMES[color]}
                />
              ))}
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="pt-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-xs text-yellow-600 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                <span>{drawingRegionsCount} unsaved highlight{drawingRegionsCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClearDrawing}
                  className="flex-1 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={onUpdateVersion}
                  className="flex-1 px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Save to Version
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
