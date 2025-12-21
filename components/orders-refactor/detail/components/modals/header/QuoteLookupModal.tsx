/**
 * QuoteLookupModal Component
 * Modal for looking up quote detail lines
 */

'use client';

import React from 'react';

interface QuoteLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  partNumber: string;
  setPartNumber: (value: string) => void;
  quoteNumber: string;
  setQuoteNumber: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  openOnly: boolean;
  setOpenOnly: (value: boolean) => void;
  blanketOnly: boolean;
  setBlanketOnly: (value: boolean) => void;
  onSearch: () => void;
}

export function QuoteLookupModal({
  isOpen,
  onClose,
  partNumber,
  setPartNumber,
  quoteNumber,
  setQuoteNumber,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  openOnly,
  setOpenOnly,
  blanketOnly,
  setBlanketOnly,
  onSearch,
}: QuoteLookupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Quote Detail Line Lookup</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Click the checkbox for each line you want to add to your order. The applicable detail lines will be inserted into your order and the corresponding quote detail line will be marked as ordered if currently set to Open.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Part Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Quote Number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Start Date<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 pr-10"
                />
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                  <rect x="3" y="4" width="14" height="14" rx="2"/>
                  <path d="M3 8h14M7 2v4M13 2v4"/>
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                End Date<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 pr-10"
                />
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                  <rect x="3" y="4" width="14" height="14" rx="2"/>
                  <path d="M3 8h14M7 2v4M13 2v4"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="w-4 h-4 accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">
                Include Only <span className="text-[var(--primary)] font-medium">Open Quotes</span>
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={blanketOnly}
                onChange={(e) => setBlanketOnly(e.target.checked)}
                className="w-4 h-4 accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">
                Include Only <span className="text-[var(--primary)] font-medium">Blanket Quotes</span>
              </span>
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSearch}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
