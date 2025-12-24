'use client';

import React from 'react';
import { FulfillmentOrder } from '@/lib/types/warehouse';

interface AuditTimestampsProps {
  fulfillmentOrder: FulfillmentOrder;
  isReleased: boolean;
  onReleaseToWarehouse: () => void;
}

export default function AuditTimestamps({
  fulfillmentOrder,
  isReleased,
  onReleaseToWarehouse,
}: AuditTimestampsProps) {
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-4">
      {/* Release Authority */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Release Authority</h3>
        </div>
        {isReleased ? (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Released By</label>
              <p className="text-sm font-medium">{fulfillmentOrder.releasedBy || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Released At</label>
              <p className="text-sm font-medium">{formatDateTime(fulfillmentOrder.releasedAt)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted-foreground)] italic">Not yet released</p>
            <button
              onClick={onReleaseToWarehouse}
              className="w-full px-3 py-2 bg-cyan-600 text-white rounded-lg font-medium text-sm hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Release to Warehouse
            </button>
          </div>
        )}
      </div>

      {/* Pick Timestamps */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Pick Timestamps</h3>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-[var(--muted-foreground)]">Started By</label>
            <p className="text-sm font-medium">{fulfillmentOrder.pickStartedBy || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)]">Started At</label>
            <p className="text-sm font-medium">{formatDateTime(fulfillmentOrder.pickStartedAt)}</p>
          </div>
          <div className="border-t border-[var(--border)] pt-2 mt-2">
            <label className="text-xs text-[var(--muted-foreground)]">Completed By</label>
            <p className="text-sm font-medium">{fulfillmentOrder.pickCompletedBy || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)]">Completed At</label>
            <p className="text-sm font-medium">{formatDateTime(fulfillmentOrder.pickCompletedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

