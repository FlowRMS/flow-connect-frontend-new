/**
 * Error State Component
 * Displays an error message with retry button
 */

import React from 'react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading pre-opportunities: {message}</p>
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
