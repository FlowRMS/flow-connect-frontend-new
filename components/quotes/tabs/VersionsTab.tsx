'use client';

import React from 'react';

interface VersionsTabProps {
  onShowRevertModal: () => void;
}

export function VersionsTab({ onShowRevertModal }: VersionsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Version History</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Track changes and compare versions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="6" height="14" rx="1"/>
              <rect x="11" y="3" width="6" height="14" rx="1"/>
            </svg>
            Compare Versions
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Create Revision
          </button>
        </div>
      </div>

      {/* Version List */}
      <div className="space-y-3">
        {[
          { version: 3, current: true, date: 'Mar 20, 2024', user: 'Sarah Chen', changes: 'Price adjustments', approvalStatus: 'pending', approvalCount: 2, value: 2450000 },
          { version: 2, current: false, date: 'Mar 18, 2024', user: 'Mike Torres', changes: 'Added fixtures', approvalStatus: 'needed', approvalCount: 4, value: 2380000 },
          { version: 1, current: false, date: 'Mar 15, 2024', user: 'Sarah Chen', changes: 'Initial quote', approvalStatus: 'needed', approvalCount: 5, value: 2200000 },
        ].map(history => (
          <div
            key={history.version}
            className={`p-4 rounded-lg border ${history.current ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] bg-[var(--card)]'}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="version"
                  defaultChecked={history.current}
                  className="accent-[var(--primary)]"
                />
                <div className="flex flex-col items-center">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${history.current ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-gray-700'}`}>
                    v{history.version}
                  </span>
                  {history.current && (
                    <span className="text-xs text-[var(--primary)] mt-1">current</span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium text-[var(--foreground)]">{history.date}</span>
                  <span className="text-[var(--muted-foreground)]">•</span>
                  <span className="text-[var(--muted-foreground)]">{history.user}</span>
                </div>
                <p className="text-sm text-[var(--foreground)]">{history.changes}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">${history.value.toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    history.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {history.approvalStatus === 'pending' ? `${history.approvalCount} pending` : `${history.approvalCount} needed`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                  View
                </button>
                {!history.current && (
                  <button
                    onClick={() => onShowRevertModal()}
                    className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 border border-orange-200 rounded hover:bg-orange-200 transition-colors"
                  >
                    Revert to v{history.version}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Changes Summary */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Changes in v3 (from v2)</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            <span className="text-sm text-green-700">Added 3 emergency lighting items ($45,000)</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
              <path d="M12 5l-4 14M7 7l-2 2 2 2M13 11l2 2-2 2"/>
            </svg>
            <span className="text-sm text-yellow-700">Price changed on 5 corridor fixtures (+4% overage applied)</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <circle cx="10" cy="10" r="7"/>
              <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm text-blue-700">Lutron approval status changed: Not Approved → Conditional</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M4 6h12M4 10h12M4 14h8"/>
            </svg>
            <span className="text-sm text-gray-700">Total value: $2,380,000 → $2,450,000 (+$70,000 / +2.9%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
