import React, { useState, useRef, useEffect } from 'react';
import type { ViewMode, SortField, SortDirection } from '../FilesContent';

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  onUpload: () => void;
  onNewFolder: () => void;
  onDelete: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isSearching: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  isUploading: boolean;
  uploadProgress: { current: number; total: number } | null;
  canUpload?: boolean; // false when at root level (no folder selected)
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  selectedCount,
  onUpload,
  onNewFolder,
  onDelete,
  searchTerm,
  onSearchChange,
  isSearching,
  sortField,
  sortDirection,
  onSortChange,
  isUploading,
  uploadProgress,
  canUpload = true,
}: ToolbarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close sort menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'name', label: 'Name' },
    { field: 'date', label: 'Date Modified' },
    { field: 'size', label: 'Size' },
    { field: 'type', label: 'Type' },
  ];

  return (
    <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between gap-4">
      {/* Left: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onNewFolder}
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            <path d="M12 11v6M9 14h6" />
          </svg>
          New Folder
        </button>

        <button
          onClick={onUpload}
          disabled={isUploading || !canUpload}
          title={!canUpload ? 'Open a folder to upload files' : undefined}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {uploadProgress ? `${uploadProgress.current}/${uploadProgress.total}` : 'Uploading...'}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <path d="M17 8l-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
              Upload
            </>
          )}
        </button>

        {selectedCount > 0 && (
          <>
            <div className="w-px h-6 bg-[var(--border)] mx-1" />
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Delete ({selectedCount})
            </button>
          </>
        )}
      </div>

      {/* Right: Search, Sort, View Toggle */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--input)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30 transition-all"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          )}
          {searchTerm && !isSearching && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M6 12h12M9 18h6" />
            </svg>
            <span className="hidden sm:inline">{sortOptions.find(o => o.field === sortField)?.label}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-1">
              {sortOptions.map((option) => (
                <button
                  key={option.field}
                  onClick={() => {
                    if (sortField === option.field) {
                      onSortChange(option.field, sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      onSortChange(option.field, 'asc');
                    }
                    setShowSortMenu(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--muted)] flex items-center justify-between"
                >
                  <span>{option.label}</span>
                  {sortField === option.field && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={sortDirection === 'desc' ? 'rotate-180' : ''}
                    >
                      <path d="M12 5v14M5 12l7-7 7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-[var(--muted)] rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-[var(--card)] shadow-sm'
                : 'hover:bg-[var(--card)]/50'
            }`}
            title="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--foreground)]">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--card)] shadow-sm'
                : 'hover:bg-[var(--card)]/50'
            }`}
            title="List view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--foreground)]">
              <rect x="3" y="4" width="18" height="2" rx="1" />
              <rect x="3" y="11" width="18" height="2" rx="1" />
              <rect x="3" y="18" width="18" height="2" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
