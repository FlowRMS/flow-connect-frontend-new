'use client';

import React from 'react';
import Link from 'next/link';

export default function TopBar() {
  return (
    <div className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
      {/* Left: Sidebar toggle */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="6"/>
              <path d="M14 14l4 4" strokeLinecap="round"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Ask your AI agent to do anything in the system..."
            className="w-full bg-[var(--input)] border border-[var(--input-border)] rounded-lg pl-10 pr-20 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <kbd className="px-1.5 py-0.5 bg-[var(--muted)] border border-[var(--border)] rounded text-xs">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-[var(--muted)] border border-[var(--border)] rounded text-xs">K</kbd>
          </div>
        </div>
      </div>

      {/* Right: Analytics, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Analytics Button */}
        <Link
          href="/analytics"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9M13 17V5M8 17v-3"/>
          </svg>
          <span>Analytics</span>
        </Link>

        {/* DISC Analytics Button */}
        <Link
          href="/disc-analytics"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3"/>
          </svg>
          <span>DISC Analytics</span>
        </Link>

        <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors relative">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5a3 3 0 013 3v3l1.5 3h-9L7 11V8a3 3 0 013-3zM8.5 16a1.5 1.5 0 003 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium text-sm">
          C
        </div>
      </div>
    </div>
  );
}
