/**
 * Reusable Sort Menu Component
 * Displays a dropdown menu with sort options
 */

'use client';

import React from 'react';
import type { SortConfig, ActiveSort } from '../types';

interface SortMenuProps {
  options: SortConfig[];
  activeSort: ActiveSort | null;
  onSortChange: (columnId: string) => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  buttonLabel?: string;
  className?: string;
}

export function SortMenu({
  options,
  activeSort,
  onSortChange,
  isOpen,
  onToggle,
  buttonLabel = 'Sort',
  className = '',
}: SortMenuProps) {
  const handleSortClick = (columnId: string) => {
    onSortChange(columnId);
    onToggle(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => onToggle(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7h4M3 12h8M3 17h12" strokeLinecap="round" />
        </svg>
        {buttonLabel}
        {activeSort && (
          <span>{activeSort.direction === 'DESC' ? ' ↓' : ' ↑'}</span>
        )}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => onToggle(false)} />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            {options.map((option) => {
              const isActive = activeSort?.columnId === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSortClick(option.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                    isActive ? 'bg-gray-50' : ''
                  }`}
                >
                  {option.label}
                  {isActive && (
                    <span>{activeSort.direction === 'DESC' ? '↓' : '↑'}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

