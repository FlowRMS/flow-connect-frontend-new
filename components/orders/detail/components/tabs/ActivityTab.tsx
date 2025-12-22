/**
 * ActivityTab Component
 * Displays activity feed for the order
 */

'use client';

import React from 'react';

export function ActivityTab() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Activity Feed</h3>
          <p className="text-sm text-[var(--muted-foreground)]">All activity and changes on this order</p>
        </div>
        <select className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]">
          <option>All Activity</option>
          <option>Price Updates</option>
          <option>Approvals</option>
          <option>Status Changes</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {/* Price Update */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                <path d="M10 4v12M6 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">PRICE UPDATE</span>
                <span className="text-xs text-[var(--muted-foreground)]">2 hours ago</span>
              </div>
              <p className="font-medium text-sm text-[var(--foreground)] mt-1">Sarah Chen updated pricing</p>
              <p className="text-sm text-[var(--muted-foreground)]">Changed overage from 10% to 12.8% on LED Troffer items</p>
            </div>
          </div>
        </div>

        {/* Approval Update */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4l2 2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">APPROVAL UPDATE</span>
                <span className="text-xs text-[var(--muted-foreground)]">Yesterday at 4:30 PM</span>
              </div>
              <p className="font-medium text-sm text-[var(--foreground)] mt-1">Lutron approval status changed</p>
              <p className="text-sm text-[var(--muted-foreground)]">Status changed to "Conditional" - specific products only approved</p>
            </div>
          </div>
        </div>

        {/* Approval Sent */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M4 4h12v12H4z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 8h12M8 4v12" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">APPROVAL SENT</span>
                <span className="text-xs text-[var(--muted-foreground)]">Mar 18, 2024 at 2:15 PM</span>
              </div>
              <p className="font-medium text-sm text-[var(--foreground)] mt-1">Mike Torres sent approval request</p>
              <p className="text-sm text-[var(--muted-foreground)]">Sent to Lutron via email at approvals@lutron.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
