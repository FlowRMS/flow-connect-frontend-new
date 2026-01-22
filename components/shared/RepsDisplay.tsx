/**
 * RepsDisplay Component
 * Reusable component for displaying sales representatives in tables
 * - Shows single rep with icon when count is 1
 * - Shows badge with count and popover when count is 2+
 */

'use client';

import React, { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

interface RepsDisplayProps {
  reps: string[] | undefined | null;
  type: 'inside' | 'outside';
  className?: string;
}

export function RepsDisplay({ reps, type, className = '' }: RepsDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle empty/null cases
  if (!reps || reps.length === 0) {
    return (
      <span className={`text-xs md:text-sm text-[var(--muted-foreground)] ${className}`}>
        -
      </span>
    );
  }

  const repCount = reps.length;
  const title = type === 'inside' ? 'Inside Reps' : 'Outside Reps';
  const badgeColor = type === 'inside' 
    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
    : 'bg-purple-100 text-purple-700 hover:bg-purple-200';

  // Single rep: show name with icon
  if (repCount === 1) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <svg 
          className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--muted-foreground)] flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
        <span className="text-xs md:text-sm text-[var(--foreground)] truncate">
          {reps[0]}
        </span>
      </div>
    );
  }

  // Multiple reps: show badge with popover
  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs md:text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 ${badgeColor} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <svg 
            className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
          <span>{repCount}</span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          sideOffset={8}
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-3 pb-2 border-b border-[var(--border)]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {title}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {repCount} {repCount === 1 ? 'representative' : 'representatives'}
                </p>
              </div>
              <PopoverPrimitive.Close asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
                  aria-label="Close"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              </PopoverPrimitive.Close>
            </div>
          </div>

          {/* Reps List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {reps.map((rep, index) => (
              <div
                key={index}
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-[var(--muted)]/30 transition-colors"
              >
                <svg 
                  className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
                <span className="text-sm text-[var(--foreground)] flex-1">
                  {rep}
                </span>
              </div>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
