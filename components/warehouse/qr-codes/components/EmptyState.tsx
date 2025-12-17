'use client';

import React from 'react';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = 'No locations found' }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <svg
        className="w-12 h-12 mx-auto text-[var(--muted-foreground)] opacity-50 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
        />
      </svg>
      <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
    </div>
  );
}
