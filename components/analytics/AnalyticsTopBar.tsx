'use client';

import React from 'react';
import Link from 'next/link';

export default function AnalyticsTopBar() {
  return (
    <div className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
      {/* Left: Sidebar toggle placeholder */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Center: Empty for now */}
      <div className="flex-1"></div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Request Report Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--primary)] text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M12 18v-6M9 15l3-3 3 3"/>
          </svg>
          <span>Request Report</span>
        </button>

        {/* Configs Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
          </svg>
          <span>Configs</span>
        </button>

        {/* Back Button */}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back</span>
        </Link>
      </div>
    </div>
  );
}
