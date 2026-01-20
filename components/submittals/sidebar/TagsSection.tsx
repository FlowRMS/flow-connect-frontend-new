'use client';

import React from 'react';
import type { SpecSheet, SpecSheetCategory } from '../../../lib/types/submittals';
import { specSheetCategoryLabels } from '../../../lib/data/submittals-mock';

interface TagsSectionProps {
  isExpanded: boolean;
  toggleSection: () => void;
  allCategories: SpecSheetCategory[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  allSpecSheets: SpecSheet[];
  setSelectedManufacturerId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
}

export function TagsSection({
  isExpanded,
  toggleSection,
  allCategories,
  selectedTags,
  setSelectedTags,
  allSpecSheets,
  setSelectedManufacturerId,
  setSelectedFolderId,
}: TagsSectionProps) {
  return (
    <div className="border-b border-[var(--border)]">
      <button
        onClick={toggleSection}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
      >
        <span>Tags</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isExpanded && (
        <div className="px-4 pb-3">
          {allCategories.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] py-2">No categories available</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map(cat => {
                  const isSelected = selectedTags.includes(cat);
                  const count = allSpecSheets.filter(s => s.categories?.includes(cat)).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(t => t !== cat));
                        } else {
                          setSelectedTags([...selectedTags, cat]);
                          setSelectedManufacturerId(null);
                          setSelectedFolderId(null);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                        isSelected
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                      }`}
                    >
                      {specSheetCategoryLabels[cat] || cat}
                      <span className={`${isSelected ? 'text-white/70' : 'text-[var(--muted-foreground)]/70'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline"
                >
                  Clear tags
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
