/**
 * Duplicate Quote Modal Component
 * Modal for entering the new quote number when duplicating a quote
 */

'use client';

import React, { useState, useEffect } from 'react';

interface DuplicateQuoteModalProps {
  isOpen: boolean;
  quoteNumber: string;
  isPending: boolean;
  onClose: () => void;
  onDuplicate: (newQuoteNumber: string) => void;
}

export function DuplicateQuoteModal({
  isOpen,
  quoteNumber,
  isPending,
  onClose,
  onDuplicate,
}: DuplicateQuoteModalProps) {
  const [newQuoteNumber, setNewQuoteNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewQuoteNumber(`${quoteNumber}-COPY`);
      setError(null);
    }
  }, [isOpen, quoteNumber]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!newQuoteNumber.trim()) {
      setError('Quote number is required');
      return;
    }
    setError(null);
    onDuplicate(newQuoteNumber.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPending) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Duplicate Quote</h3>
              <p className="text-sm text-gray-500">From {quoteNumber}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Quote Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newQuoteNumber}
              onChange={(e) => {
                setNewQuoteNumber(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter new quote number..."
              className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
              autoFocus
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}

          <p className="mt-3 text-xs text-gray-500">
            A copy of the quote will be created with all line items and details.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !newQuoteNumber.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Duplicating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
