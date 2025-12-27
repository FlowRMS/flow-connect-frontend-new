'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for the two modes
const SimpleQuotesContent = dynamic(
  () => import('@/components/quotes/SimpleQuotesContent'),
  { ssr: false }
);

const QuotesContent = dynamic(
  () => import('@/components/QuotesContent'),
  { ssr: false }
);

// Loading component
function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 mx-auto text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-4 text-[var(--muted-foreground)]">Loading quotes...</p>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  // Store mode preference in localStorage
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('quotes-mode') as 'simple' | 'advanced' | null;
    if (savedMode) {
      setMode(savedMode);
    }
    setIsLoaded(true);
  }, []);

  // Save preference when it changes
  const handleModeChange = (newMode: 'simple' | 'advanced') => {
    setMode(newMode);
    localStorage.setItem('quotes-mode', newMode);
  };

  // Don't render until we've loaded the preference
  if (!isLoaded) {
    return <LoadingFallback />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Mode Toggle Header */}
      <div className="flex-shrink-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--muted-foreground)]">View Mode:</span>
            <div className="flex items-center bg-[var(--muted)] rounded-lg p-1">
              <button
                onClick={() => handleModeChange('simple')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'simple'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
                Simple
              </button>
              <button
                onClick={() => handleModeChange('advanced')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'advanced'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Advanced
              </button>
            </div>
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {mode === 'simple' ? 'Streamlined quote management' : 'Full-featured quote builder'}
          </div>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<LoadingFallback />}>
        {mode === 'simple' ? <SimpleQuotesContent /> : <QuotesContent />}
      </Suspense>
    </div>
  );
}
