'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for the advanced quotes content
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
        <p className="mt-4 text-[var(--muted-foreground)]">Loading quote...</p>
      </div>
    </div>
  );
}

export default function QuoteDetailPage() {
  const params = useParams();
  const quoteId = params.id as string;

  // Check if this is "new" quote
  const isNewQuote = quoteId === 'new';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
      <Suspense fallback={<LoadingFallback />}>
        <QuotesContent initialQuoteId={isNewQuote ? 'new' : quoteId} />
      </Suspense>
    </div>
  );
}
