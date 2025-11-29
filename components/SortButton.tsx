'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export type ActiveSort = {
  columnName: string;
  direction: 'ASC' | 'DESC';
};

type SortOption = {
  columnName: string;
  label: string;
};

type SortButtonProps = {
  sortOptions: SortOption[];
  onSortChange?: (sort: ActiveSort | undefined) => void;
  onMultiSortChange?: (sorts: ActiveSort[]) => void;
  activeSort?: ActiveSort;
  activeSorts?: ActiveSort[];
};

// Stable empty array to prevent unnecessary re-renders
const EMPTY_SORTS: ActiveSort[] = [];

export default function SortButton({ 
  sortOptions, 
  onSortChange,
  onMultiSortChange,
  activeSort,
  activeSorts,
}: SortButtonProps) {
  // Use stable reference for empty array
  const stableActiveSorts = activeSorts ?? EMPTY_SORTS;
  
  const [isOpen, setIsOpen] = useState(false);
  const [localSorts, setLocalSorts] = useState<ActiveSort[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Create stable key for sorts to compare
  const sortsKey = useMemo(() => {
    if (stableActiveSorts.length > 0) {
      return JSON.stringify(stableActiveSorts);
    }
    if (activeSort) {
      return JSON.stringify([activeSort]);
    }
    return '';
  }, [stableActiveSorts, activeSort]);

  // Sync local sorts with props - use sortsKey for stable comparison
  useEffect(() => {
    if (stableActiveSorts.length > 0) {
      setLocalSorts(stableActiveSorts);
    } else if (activeSort) {
      setLocalSorts([activeSort]);
    } else {
      setLocalSorts([]);
    }
  }, [sortsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSort = (columnName: string, direction: 'ASC' | 'DESC') => {
    // Check if this column is already being sorted
    const existingIndex = localSorts.findIndex(s => s.columnName === columnName);
    let newSorts: ActiveSort[];
    
    if (existingIndex >= 0 && localSorts[existingIndex].direction === direction) {
      // If clicking same sort with same direction, remove it
      newSorts = localSorts.filter((_, i) => i !== existingIndex);
    } else if (existingIndex >= 0) {
      // If column exists but with different direction, update it
      newSorts = localSorts.map((s, i) => 
        i === existingIndex ? { columnName, direction } : s
      );
    } else {
      // Add new sort
      newSorts = [...localSorts, { columnName, direction }];
    }
    
    setLocalSorts(newSorts);
    
    // Notify parents
    if (onMultiSortChange) {
      onMultiSortChange(newSorts);
    }
    if (onSortChange) {
      onSortChange(newSorts.length > 0 ? newSorts[0] : undefined);
    }
  };

  const handleClearSort = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalSorts([]);
    if (onMultiSortChange) {
      onMultiSortChange([]);
    }
    if (onSortChange) {
      onSortChange(undefined);
    }
    setIsOpen(false);
  };

  const getSortIndex = (columnName: string): number => {
    return localSorts.findIndex(s => s.columnName === columnName);
  };

  const getSortDirection = (columnName: string): 'ASC' | 'DESC' | null => {
    const sort = localSorts.find(s => s.columnName === columnName);
    return sort ? sort.direction : null;
  };

  const sortCount = localSorts.length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${
          sortCount > 0 
            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
            : 'border-[var(--border)] hover:bg-[var(--muted)]'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M6 12h12M9 18h6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Sort
        {sortCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-[var(--primary)] text-white text-xs rounded-full">
            {sortCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl z-50 border border-gray-100 overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Sort By (Multi-Select)</span>
            {sortCount > 0 && (
              <button 
                onClick={handleClearSort}
                className="text-xs text-red-500 hover:text-red-700 px-2"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {sortOptions.map((option) => {
              const sortIndex = getSortIndex(option.columnName);
              const direction = getSortDirection(option.columnName);
              const isActive = sortIndex >= 0;
              
              return (
                <div key={option.columnName} className="px-1">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-md group ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <span className={`text-sm flex items-center gap-2 ${isActive ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                      {option.label}
                      {isActive && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                          {sortIndex + 1}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSort(option.columnName, 'ASC')}
                        className={`p-1.5 rounded transition-colors ${
                          direction === 'ASC'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                        }`}
                        title="Ascending"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleSort(option.columnName, 'DESC')}
                        className={`p-1.5 rounded transition-colors ${
                          direction === 'DESC'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                        }`}
                        title="Descending"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {sortCount > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-500 mb-2">Active sorts (in order):</div>
              <div className="flex flex-wrap gap-1">
                {localSorts.map((sort, index) => {
                  const option = sortOptions.find(o => o.columnName === sort.columnName);
                  return (
                    <span key={sort.columnName} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      <span className="font-medium">{index + 1}.</span>
                      {option?.label || sort.columnName}
                      <span className="text-blue-500">({sort.direction})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
