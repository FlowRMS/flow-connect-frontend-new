'use client';

import React from 'react';
import type { HighlightRegion } from '../../../../lib/types/submittals';
import { ChevronIcon } from './icons';

interface TagsSectionProps {
  selectedRegion: HighlightRegion | null | undefined;
  newTag: string;
  setNewTag: (tag: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function TagsSection({
  selectedRegion,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag,
  expanded,
  onToggle,
}: TagsSectionProps) {
  return (
    <div className="border-b border-[var(--border)]">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Tags</h3>
          {selectedRegion?.tags && selectedRegion.tags.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
              {selectedRegion.tags.length}
            </span>
          )}
        </div>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            Add tags to categorize this highlight
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddTag();
                }
              }}
              placeholder="Enter tag name..."
              className="flex-1 px-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
            <button
              onClick={onAddTag}
              disabled={!newTag.trim()}
              className="px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>

          {selectedRegion?.tags && selectedRegion.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedRegion.tags.map((tag, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--muted)] text-[var(--foreground)] rounded-full"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => onRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors"
                    title="Remove tag"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)] italic">No tags added yet</p>
          )}
        </div>
      )}
    </div>
  );
}
