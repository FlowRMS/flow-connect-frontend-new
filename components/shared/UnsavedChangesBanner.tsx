/**
 * UnsavedChangesBanner Component
 * Displays a subtle banner indicating there are unsaved changes
 * Used across Quote, Order, Invoice, and Commission detail pages
 */

'use client';

import React from 'react';

interface UnsavedChangesBannerProps {
  /**
   * Whether there are unsaved changes to display
   */
  hasChanges: boolean;

  /**
   * Optional message to display (defaults to "You have unsaved changes")
   */
  message?: string;

  /**
   * Position of the banner: 'top' or 'inline'
   * 'top' - Fixed position at top of container
   * 'inline' - Inline within the page flow
   */
  position?: 'top' | 'inline';

  /**
   * Optional class name for additional styling
   */
  className?: string;
}

export function UnsavedChangesBanner({
  hasChanges,
  message = 'You have unsaved changes',
  position = 'inline',
  className = '',
}: UnsavedChangesBannerProps) {
  if (!hasChanges) {
    return null;
  }

  const baseClasses = 'flex items-center gap-2 px-4 py-2 bg-amber-50 border-amber-200 text-amber-700 text-sm';
  const positionClasses = position === 'top' ? 'border-b' : 'border rounded-lg';

  return (
    <div className={`${baseClasses} ${positionClasses} ${className}`}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="flex-shrink-0"
      >
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4M10 14h.01" strokeLinecap="round" />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  );
}

export default UnsavedChangesBanner;
