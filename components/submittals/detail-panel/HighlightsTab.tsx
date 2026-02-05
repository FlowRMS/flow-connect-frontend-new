'use client';

import React from 'react';
import type { HighlightDefinition } from '../../../lib/types/submittals';

interface HighlightsTabProps {
  highlights: HighlightDefinition[];
  showNewHighlightForm: boolean;
  newHighlightCatalog: string;
  setNewHighlightCatalog: (value: string) => void;
  setShowNewHighlightForm: (value: boolean) => void;
  handleAddHighlight: () => void;
  handleEditHighlight: (highlight: HighlightDefinition) => void;
  handleCancelNewForm: () => void;
}

export function HighlightsTab({
  highlights,
  showNewHighlightForm,
  newHighlightCatalog,
  setNewHighlightCatalog,
  setShowNewHighlightForm,
  handleAddHighlight,
  handleEditHighlight,
  handleCancelNewForm,
}: HighlightsTabProps) {
  return (
    <div className="p-4">
      {highlights.length === 0 && !showNewHighlightForm ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">No highlights defined yet</p>
          <button
            onClick={() => setShowNewHighlightForm(true)}
            className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
          >
            Add highlight for a part number
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* New Highlight Form */}
          {showNewHighlightForm && (
            <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg p-3">
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                Part/Catalog Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHighlightCatalog}
                  onChange={(e) => setNewHighlightCatalog(e.target.value)}
                  placeholder="e.g. AX1-LED-40K"
                  className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddHighlight();
                    if (e.key === 'Escape') handleCancelNewForm();
                  }}
                />
                <button
                  onClick={handleAddHighlight}
                  disabled={!newHighlightCatalog.trim()}
                  className="px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <button
                onClick={handleCancelNewForm}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-2"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Existing Highlights */}
          {highlights.map(highlight => (
            <HighlightItem
              key={highlight.id}
              highlight={highlight}
              onEdit={() => handleEditHighlight(highlight)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Highlight Item Component
function HighlightItem({ highlight, onEdit }: { highlight: HighlightDefinition; onEdit?: () => void }) {
  return (
    <div className="bg-[var(--muted)]/50 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">{highlight.catalogNumber}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{highlight.manufacturer}</p>
        </div>
        <button
          onClick={onEdit}
          className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
          title="Edit highlight"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 13V16H7L16 7L13 4L4 13Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="16" height="16" rx="2"/>
          </svg>
          {highlight.regions.length} region{highlight.regions.length !== 1 ? 's' : ''}
        </span>
        <span>•</span>
        <span>
          Page{highlight.regions.length > 1 ? 's' : ''} {Array.from(new Set(highlight.regions.map(r => r.pageNumber))).sort((a, b) => a - b).join(', ')}
        </span>
      </div>
    </div>
  );
}
