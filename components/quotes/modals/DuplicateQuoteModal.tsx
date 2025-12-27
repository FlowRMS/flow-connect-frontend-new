'use client';

import React from 'react';
import type { Quote } from '../types';

interface DuplicateQuoteModalProps {
  show: boolean;
  selectedQuote: Quote | null;
  duplicateQuoteNumber: string;
  duplicateCustomer: string;
  duplicatePercentIncrease: number;
  duplicateCopyNotes: boolean;
  availableEndUsers: string[];
  onClose: () => void;
  onSetDuplicateQuoteNumber: (value: string) => void;
  onSetDuplicateCustomer: (value: string) => void;
  onSetDuplicatePercentIncrease: (value: number) => void;
  onSetDuplicateCopyNotes: (value: boolean) => void;
}

export function DuplicateQuoteModal({
  show,
  selectedQuote,
  duplicateQuoteNumber,
  duplicateCustomer,
  duplicatePercentIncrease,
  duplicateCopyNotes,
  availableEndUsers,
  onClose,
  onSetDuplicateQuoteNumber,
  onSetDuplicateCustomer,
  onSetDuplicatePercentIncrease,
  onSetDuplicateCopyNotes,
}: DuplicateQuoteModalProps) {
  if (!show || !selectedQuote) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-3xl w-full">
        <div className="px-6 py-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <rect x="6" y="6" width="14" height="14" rx="2"/>
              <path d="M4 16V6a2 2 0 012-2h10"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Duplicate Quote # <span className="text-[var(--primary)]">{selectedQuote.name}</span>
            </h2>
            <div className="mt-3 space-y-2">
              <div>
                <span className="text-sm font-medium text-orange-600">Note:</span>
                <p className="text-sm text-[var(--muted-foreground)]">
                  If you change the End User, all detail lines on the new Quote(s) will be changed and the associated sales reps will be defaulted to the ones listed on the End User's profile.
                </p>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                After submitting, you can find your new Quotes on the Quotes Landing page. <span className="font-medium text-[var(--foreground)]">Hint:</span> Filter by just your Quotes for only Today to see these results quickly.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)]">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">New Quote Number *</label>
              <input
                type="text"
                value={duplicateQuoteNumber}
                onChange={(e) => onSetDuplicateQuoteNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Customer*</label>
              <select
                value={duplicateCustomer}
                onChange={(e) => onSetDuplicateCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white"
              >
                <option value="">Select...</option>
                {availableEndUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Percent Increase*</label>
              <input
                type="number"
                value={duplicatePercentIncrease}
                onChange={(e) => onSetDuplicatePercentIncrease(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Copy Notes</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSetDuplicateCopyNotes(!duplicateCopyNotes)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    duplicateCopyNotes ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                      duplicateCopyNotes ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-[var(--muted-foreground)]">Yes</span>
              </div>
            </div>
            <button className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[var(--border)] rounded-full hover:bg-[var(--muted)] transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
