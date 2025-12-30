'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Something went wrong
        </h2>
        <p className="text-[var(--muted-foreground)] mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
