'use client';

import React from 'react';
import type { SpecSheet } from '../../lib/types/submittals';

interface SpecSheetCardProps {
  specSheet: SpecSheet;
  highlightCount: number;
  onClick: () => void;
  isSelected: boolean;
  // Multi-select props
  isMultiSelected?: boolean;
  onToggleSelect?: (id: string, isCtrlOrCmd: boolean) => void;
  selectedIds?: Set<string>;
  // Context menu
  onContextMenu?: (e: React.MouseEvent, specSheet: SpecSheet) => void;
}

export function SpecSheetCard({
  specSheet,
  highlightCount,
  onClick,
  isSelected,
  isMultiSelected = false,
  onToggleSelect,
  selectedIds = new Set(),
  onContextMenu,
}: SpecSheetCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    // If this item is selected and there are multiple selections, drag all selected
    const idsToMove = isMultiSelected && selectedIds.size > 1
      ? Array.from(selectedIds)
      : [specSheet.id];

    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'specSheet',
      ids: idsToMove,
      id: specSheet.id, // Keep single ID for backward compatibility
      displayName: specSheet.displayName,
      count: idsToMove.length,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(specSheet.id, e.ctrlKey || e.metaKey);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, specSheet);
    }
  };

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      className={`bg-[var(--card)] rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md relative group ${
        isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'
      } ${isMultiSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Multi-select checkbox */}
      {onToggleSelect && (
        <div
          onClick={handleCheckboxClick}
          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
            isMultiSelected
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'bg-white/80 border-gray-300 hover:border-blue-400 opacity-0 group-hover:opacity-100'
          } ${isMultiSelected ? 'opacity-100' : ''}`}
        >
          {isMultiSelected && (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      )}

      {/* Context menu button */}
      {onContextMenu && (
        <button
          onClick={handleMenuClick}
          className="absolute top-2 right-2 z-10 p-1.5 rounded bg-white/80 hover:bg-white text-[var(--muted-foreground)] hover:text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="5" r="1.5"/>
            <circle cx="10" cy="10" r="1.5"/>
            <circle cx="10" cy="15" r="1.5"/>
          </svg>
        </button>
      )}

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
  // Multi-select props
  isMultiSelected?: boolean;
  onToggleSelect?: (id: string, isCtrlOrCmd: boolean) => void;
  selectedIds?: Set<string>;
  // Context menu
  onContextMenu?: (e: React.MouseEvent, specSheet: SpecSheet) => void;
}

export function SpecSheetListItem({
  specSheet,
  highlightCount,
  onClick,
  isSelected,
  isMultiSelected = false,
  onToggleSelect,
  selectedIds = new Set(),
  onContextMenu,
}: SpecSheetListItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    // If this item is selected and there are multiple selections, drag all selected
    const idsToMove = isMultiSelected && selectedIds.size > 1
      ? Array.from(selectedIds)
      : [specSheet.id];

    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'specSheet',
      ids: idsToMove,
      id: specSheet.id, // Keep single ID for backward compatibility
      displayName: specSheet.displayName,
      count: idsToMove.length,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(specSheet.id, e.ctrlKey || e.metaKey);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, specSheet);
    }
  };

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      className={`bg-[var(--card)] rounded-lg border p-4 cursor-pointer transition-all hover:shadow-sm flex items-center gap-4 group ${
        isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'
      } ${isMultiSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Multi-select checkbox */}
      {onToggleSelect && (
        <div
          onClick={handleCheckboxClick}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
            isMultiSelected
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'bg-white border-gray-300 hover:border-blue-400 opacity-0 group-hover:opacity-100'
          } ${isMultiSelected ? 'opacity-100' : ''}`}
        >
          {isMultiSelected && (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      )}

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
        onClick={handleMenuClick}
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
