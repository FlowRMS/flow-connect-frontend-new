'use client';

import React from 'react';
import { ChevronIcon } from './icons';

interface AIHighlightSectionProps {
  aiHighlightPrompt: string;
  setAiHighlightPrompt: (prompt: string) => void;
  isAiProcessing: boolean;
  aiError: string | null;
  onAiHighlight: () => void;
  expanded: boolean;
  onToggle: () => void;
}

const QUICK_TERMS = ['wattage', 'dimensions', 'lumens', 'CCT'];

export function AIHighlightSection({
  aiHighlightPrompt,
  setAiHighlightPrompt,
  isAiProcessing,
  aiError,
  onAiHighlight,
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
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">AI Highlight</h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full font-medium">
            Beta
          </span>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-[var(--muted-foreground)]">
            Describe what you want to highlight and AI will find it on the spec sheet.
          </p>
          <textarea
            value={aiHighlightPrompt}
            onChange={(e) => setAiHighlightPrompt(e.target.value)}
            placeholder='e.g., "Highlight the wattage and lumen output" or "Find the product dimensions"'
            className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg resize-none placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            rows={2}
            disabled={isAiProcessing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onAiHighlight();
              }
            }}
          />
          <button
            onClick={onAiHighlight}
            disabled={!aiHighlightPrompt.trim() || isAiProcessing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAiProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing PDF...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>Highlight with AI</span>
              </>
            )}
          </button>
          {aiError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              {aiError}
            </p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            <span className="text-[10px] text-[var(--muted-foreground)]">Try:</span>
            {QUICK_TERMS.map(term => (
              <button
                key={term}
                onClick={() => setAiHighlightPrompt(`Highlight the ${term}`)}
                className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded transition-colors"
                disabled={isAiProcessing}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
