'use client';

import React from 'react';

interface GenerateDistributorQuotesModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

const distributors = [
  { name: 'Graybar Electric', domain: 'graybar.com', manufacturers: 8, category: 'Stocking' },
  { name: 'HD Supply', domain: 'hdsupply.com', manufacturers: 6, category: 'Mixed' },
  { name: 'Ferguson Enterprises', domain: 'fergusons.com', manufacturers: 5, category: 'Buy-Sell' },
  { name: 'Rexel', domain: 'rexel.com', manufacturers: 4, category: 'Non-Stocking' },
];

export function GenerateDistributorQuotesModal({
  show,
  onClose,
  onGenerate,
}: GenerateDistributorQuotesModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Generate Distributor-Specific Quotes</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Select distributors to generate customized quotes with appropriate pricing and cross-references.
          </p>

          <div className="space-y-3">
            {distributors.map(dist => (
              <label key={dist.domain} className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-[var(--primary)]" defaultChecked={dist.domain === 'graybar.com'} />
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{dist.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{dist.manufacturers} manufacturers authorized</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{dist.category}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            Generate Quotes
          </button>
        </div>
      </div>
    </div>
  );
}
