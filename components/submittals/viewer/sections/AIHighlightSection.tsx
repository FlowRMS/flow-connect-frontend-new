'use client';

import React from 'react';
import { ChevronIcon } from './icons';

interface AIHighlightSectionProps {
  expanded: boolean;
  onToggle: () => void;
}

export function AIHighlightSection({
  expanded,
  onToggle,
}: AIHighlightSectionProps) {
  return (
    <div className="border-b border-[var(--border)] bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500/50 to-blue-500/50 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)]">AI Highlight</h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full font-medium">
            Coming Soon
          </span>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-[var(--muted)]/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-500">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">AI-Powered Highlighting</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Soon you&apos;ll be able to describe what you want to highlight and AI will find it automatically.
              </p>
            </div>
          </div>
          <div className="space-y-2 opacity-50 pointer-events-none">
            <textarea
              placeholder='e.g., "Highlight the wattage and lumen output"'
              className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg resize-none placeholder:text-[var(--muted-foreground)]"
              rows={2}
              disabled
            />
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg opacity-50 cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span>Highlight with AI</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
