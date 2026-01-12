/**
 * AutoPopulateButton Component
 * Small button shown next to dropdowns for auto-populating reps
 */

'use client';

import React from 'react';

interface AutoPopulateButtonProps {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AutoPopulateButton({
  label,
  onClick,
  isLoading = false,
  disabled = false,
  className = '',
}: AutoPopulateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium
        bg-indigo-50 text-indigo-700 border border-indigo-200
        rounded hover:bg-indigo-100 hover:border-indigo-300
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors whitespace-nowrap
        ${className}
      `}
      title={label}
    >
      {isLoading ? (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 17h14" strokeLinecap="round" />
        </svg>
      )}
      {label}
    </button>
  );
}

export default AutoPopulateButton;
