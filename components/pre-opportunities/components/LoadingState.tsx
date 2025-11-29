/**
 * Loading State Component
 * Displays a loading indicator for pre-opportunities
 */

import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading pre-opportunities...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-[var(--muted-foreground)]">{message}</div>
    </div>
  );
}
