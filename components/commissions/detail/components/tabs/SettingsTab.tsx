/**
 * SettingsTab Component
 * Displays settings for commission calculation
 */

'use client';

import React from 'react';

interface SettingsTabProps {
  commissionSource: 'invoice' | 'order';
  onSetCommissionSource: (source: 'invoice' | 'order') => void;
}

export function SettingsTab({
  commissionSource,
  onSetCommissionSource,
}: SettingsTabProps) {
  return (
    <div className="max-w-2xl">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">
            Commission Settings
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Configure how commissions are calculated for this check.
          </p>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Expected Commission Source
              </label>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                Choose whether expected commission totals are calculated from
                invoices or orders.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => onSetCommissionSource('invoice')}
                  className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    commissionSource === 'invoice'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M4 4h12v14H4zM7 8h6M7 11h6M7 14h4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    From Invoices
                  </div>
                </button>
                <button
                  onClick={() => onSetCommissionSource('order')}
                  className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    commissionSource === 'order'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M3 3h14v4H3zM3 10h14v7H3zM7 7v3M13 7v3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    From Orders
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

