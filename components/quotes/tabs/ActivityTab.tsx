'use client';

import React from 'react';

export function ActivityTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Activity Feed</h2>
          <p className="text-sm text-[var(--muted-foreground)]">All activity and changes on this quote</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
            <option>All Activity</option>
            <option>Price Changes</option>
            <option>Approvals</option>
            <option>Emails</option>
            <option>Versions</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {/* Price Update */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M12 4v12M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">PRICE UPDATE</span>
                <span className="text-xs text-[var(--muted-foreground)]">2 hours ago</span>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-1">Sarah Chen updated pricing</p>
              <p className="text-sm text-[var(--muted-foreground)]">Changed overage from 10% to 12.8% on LED Troffer items</p>
            </div>
          </div>
        </div>

        {/* Approval Status */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4l2.5 1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">APPROVAL UPDATE</span>
                <span className="text-xs text-[var(--muted-foreground)]">Yesterday at 4:30 PM</span>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-1">Lutron approval status changed</p>
              <p className="text-sm text-[var(--muted-foreground)]">Status changed to "Conditional" - specific products only approved</p>
            </div>
          </div>
        </div>

        {/* Email Sent */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <rect x="2" y="4" width="16" height="12" rx="2"/>
                <path d="M18 6l-8 5-8-5"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">APPROVAL SENT</span>
                <span className="text-xs text-[var(--muted-foreground)]">Mar 18, 2024 at 2:15 PM</span>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-1">Mike Torres sent approval request</p>
              <p className="text-sm text-[var(--muted-foreground)]">Sent Lutron approval request to builder@turnerconstruction.com</p>
            </div>
          </div>
        </div>

        {/* Quote Sent */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                <path d="M4 4l12 6-12 6V4z" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">QUOTE SENT</span>
                <span className="text-xs text-[var(--muted-foreground)]">Mar 16, 2024 at 10:30 AM</span>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-1">Sarah Chen sent quote to recipient</p>
              <p className="text-sm text-[var(--muted-foreground)]">Sent to John Smith at Graybar (Level: Sell)</p>
            </div>
          </div>
        </div>

        {/* Version Created */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                <path d="M14 2v4h-4"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">VERSION CREATED</span>
                <span className="text-xs text-[var(--muted-foreground)]">Mar 15, 2024 at 3:45 PM</span>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-1">Sarah Chen created version v3</p>
              <p className="text-sm text-[var(--muted-foreground)]">New version created with updated fixture selections</p>
            </div>
          </div>
        </div>

        {/* Quote Created */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">QUOTE CREATED</span>
                <span className="text-xs text-[var(--muted-foreground)]">Mar 10, 2024 at 9:00 AM</span>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-1">Sarah Chen created this quote</p>
              <p className="text-sm text-[var(--muted-foreground)]">Quote Q-2024-0892 created for Downtown Office Tower</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
