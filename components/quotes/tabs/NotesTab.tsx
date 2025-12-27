'use client';

import React from 'react';

export function NotesTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Notes</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Internal notes for this quote</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
          </svg>
          Add Note
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {/* Note 1 */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-[var(--foreground)]">SC</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-[var(--foreground)]">Sarah Chen</span>
                <span className="text-xs text-[var(--muted-foreground)]">Mar 20, 2024 at 2:34 PM</span>
              </div>
              <p className="text-sm text-[var(--foreground)]">
                Customer asked for 5% discount on corridor fixtures. Applied 4% - need manager approval for more.
              </p>
            </div>
            <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="5" r="1"/>
                <circle cx="10" cy="10" r="1"/>
                <circle cx="10" cy="15" r="1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Note 2 */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-[var(--foreground)]">MT</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-[var(--foreground)]">Mike Torres</span>
                <span className="text-xs text-[var(--muted-foreground)]">Mar 18, 2024 at 4:15 PM</span>
              </div>
              <p className="text-sm text-[var(--foreground)]">
                Spoke with Turner Construction - they prefer Lutron but are open to alternatives if pricing is better. Deadline for approval response is end of month.
              </p>
            </div>
            <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="5" r="1"/>
                <circle cx="10" cy="10" r="1"/>
                <circle cx="10" cy="15" r="1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Note 3 */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-[var(--foreground)]">SC</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-[var(--foreground)]">Sarah Chen</span>
                <span className="text-xs text-[var(--muted-foreground)]">Mar 10, 2024 at 9:15 AM</span>
              </div>
              <p className="text-sm text-[var(--foreground)]">
                Customer has expressed interest in upgrading to premium fixtures. May need to adjust lead times based on manufacturer availability. Follow up with Turner Construction regarding approval timeline.
              </p>
            </div>
            <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="5" r="1"/>
                <circle cx="10" cy="10" r="1"/>
                <circle cx="10" cy="15" r="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
