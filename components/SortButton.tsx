'use client';

import React, { useState, useRef, useEffect } from 'react';

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
  activeSort?: ActiveSort;
};

export default function SortButton({ 
  sortOptions, 
  onSortChange,
  activeSort,
}: SortButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    if (onSortChange) {
      // If clicking the same sort, toggle direction or clear? 
      // Current logic: just set it.
      onSortChange({ columnName, direction });
    }
    setIsOpen(false);
  };

  const handleClearSort = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSortChange) {
      onSortChange(undefined);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${
          activeSort 
            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
            : 'border-[var(--border)] hover:bg-[var(--muted)]'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M6 12h12M9 18h6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Sort
        {activeSort && (
          <span className="ml-1 px-1.5 py-0.5 bg-[var(--primary)] text-white text-xs rounded-full">
            1
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-100 overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Sort By</span>
            {activeSort && (
              <button 
                onClick={handleClearSort}
                className="text-xs text-red-500 hover:text-red-700 px-2"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {sortOptions.map((option) => (
              <div key={option.columnName} className="px-1">
                <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-md group">
                  <span className={`text-sm ${activeSort?.columnName === option.columnName ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort(option.columnName, 'ASC')}
                      className={`p-1 rounded hover:bg-gray-200 ${
                        activeSort?.columnName === option.columnName && activeSort?.direction === 'ASC'
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-400'
                      }`}
                      title="Ascending"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleSort(option.columnName, 'DESC')}
                      className={`p-1 rounded hover:bg-gray-200 ${
                        activeSort?.columnName === option.columnName && activeSort?.direction === 'DESC'
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-400'
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
