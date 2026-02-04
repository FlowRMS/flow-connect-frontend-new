'use client';

import React from 'react';

interface PageNavigationProps {
  currentPage: number;
  numPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function PageNavigation({
  currentPage,
  numPages,
  onPrevious,
  onNext,
}: PageNavigationProps) {
  return (
    <div className="flex items-center justify-center gap-4 px-6 py-3 border-t border-[var(--border)] bg-[var(--muted)]/30">
      <button
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="p-2 hover:bg-[var(--muted)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <span className="text-sm text-[var(--foreground)]">
        Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{numPages}</span>
      </span>
      <button
        onClick={onNext}
        disabled={currentPage === numPages}
        className="p-2 hover:bg-[var(--muted)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
