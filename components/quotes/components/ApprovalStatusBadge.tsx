'use client';

import React, { useState } from 'react';

interface ApprovalStatusBadgeProps {
  status: 'clear' | 'pending' | 'blocked';
  count: number;
  manufacturers?: { name: string; status: string }[];
}

export function ApprovalStatusBadge({ status, count, manufacturers = [] }: ApprovalStatusBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Mock manufacturers if not provided
  const pendingMfrs = manufacturers.length > 0 ? manufacturers : [
    { name: 'Lutron', status: 'Awaiting response' },
    { name: 'Signify', status: 'Request not sent' },
  ];

  if (status === 'clear') {
    return (
      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Approved
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1 cursor-help">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="7"/>
            <path d="M10 6v4l2 2" strokeLinecap="round"/>
          </svg>
          {count} Pending
        </span>

        {showTooltip && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-3 w-64">
            <div className="text-sm font-semibold text-[var(--foreground)] mb-2">
              Pending Approvals ({count})
            </div>

            <div className="space-y-2 text-xs">
              {pendingMfrs.slice(0, count).map((mfr, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="font-medium text-[var(--foreground)]">{mfr.name}</span>
                  <span className="text-yellow-600">{mfr.status}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)]">
                Resolve approvals before sending quote
              </p>
            </div>

            {/* Arrow pointer */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px]">
              <div className="w-2 h-2 bg-[var(--card)] border-l border-t border-[var(--border)] rotate-45"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1 cursor-help">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="7"/>
          <path d="M8 8l4 4M12 8l-4 4" strokeLinecap="round"/>
        </svg>
        {count} Blocked
      </span>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-3 w-64">
          <div className="text-sm font-semibold text-red-700 mb-2">
            Blocked Approvals ({count})
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-red-50 rounded">
              <span className="font-medium text-[var(--foreground)]">Signify</span>
              <span className="text-red-600">Rejected</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-[var(--border)]">
            <p className="text-xs text-red-600 font-medium">
              Cannot send quote until resolved
            </p>
          </div>

          {/* Arrow pointer */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px]">
            <div className="w-2 h-2 bg-[var(--card)] border-l border-t border-[var(--border)] rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}
