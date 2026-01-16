'use client';

import React from 'react';
import type { SpecSheet } from '../../lib/types/submittals';

interface SpecSheetCardProps {
  specSheet: SpecSheet;
  highlightCount: number;
  onClick: () => void;
  isSelected: boolean;
}

export function SpecSheetCard({
  specSheet,
  highlightCount,
  onClick,
  isSelected,
}: SpecSheetCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--card)] rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'
      }`}
    >
      {/* PDF Preview Placeholder */}
      <div className="aspect-[3/4] bg-[var(--muted)] flex items-center justify-center relative">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)]">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9H8M10 13H8M14 13h-4M14 17H8" strokeLinecap="round"/>
        </svg>
        {specSheet.needsReview && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4M10 14h.01"/>
              </svg>
              Review
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background)]/80 px-1.5 py-0.5 rounded">
            {specSheet.pageCount} pages
          </span>
          {highlightCount > 0 && (
            <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
              {highlightCount} highlights
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 mb-1">
          {specSheet.displayName}
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">{specSheet.manufacturer}</p>
        <div className="flex flex-wrap gap-1">
          {specSheet.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {specSheet.tags.length > 2 && (
            <span className="text-xs text-[var(--muted-foreground)]">
              +{specSheet.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface SpecSheetListItemProps {
  specSheet: SpecSheet;
  highlightCount: number;
  onClick: () => void;
  isSelected: boolean;
}

export function SpecSheetListItem({
  specSheet,
  highlightCount,
  onClick,
  isSelected,
}: SpecSheetListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--card)] rounded-lg border p-4 cursor-pointer transition-all hover:shadow-sm flex items-center gap-4 ${
        isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'
      }`}
    >
      {/* Icon */}
      <div className="w-12 h-12 bg-[var(--muted)] rounded flex items-center justify-center flex-shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-[var(--foreground)] truncate">
            {specSheet.displayName}
          </h3>
          {specSheet.needsReview && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex-shrink-0">
              Needs Review
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mb-1">{specSheet.manufacturer}</p>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span>{specSheet.pageCount} pages</span>
          <span>{(specSheet.fileSize / 1024 / 1024).toFixed(1)} MB</span>
          <span>Used {specSheet.usageCount}x</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {specSheet.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
        {specSheet.tags.length > 3 && (
          <span className="text-xs text-[var(--muted-foreground)]">+{specSheet.tags.length - 3}</span>
        )}
      </div>

      {/* Highlights */}
      <div className="flex-shrink-0 text-right">
        {highlightCount > 0 ? (
          <span className="text-sm font-medium text-green-600">{highlightCount} highlights</span>
        ) : (
          <span className="text-sm text-[var(--muted-foreground)]">No highlights</span>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={(e) => { e.stopPropagation(); }}
        className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors flex-shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="5" r="1.5"/>
          <circle cx="10" cy="10" r="1.5"/>
          <circle cx="10" cy="15" r="1.5"/>
        </svg>
      </button>
    </div>
  );
}
