'use client';

import React from 'react';
import { toast } from 'sonner';
import { useDeleteQuote } from '../api';

// Generic quote type that works with both QuoteLandingPage and local Quote types
interface QuoteForDelete {
  id: string;
  quoteNumber?: string;
  name?: string;
}

interface DeleteQuoteModalProps {
  quote: QuoteForDelete;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteQuoteModal({ quote, onClose, onDeleted }: DeleteQuoteModalProps) {
  const deleteQuoteMutation = useDeleteQuote();

  // Use quoteNumber if available, otherwise use name or id
  const displayName = quote.quoteNumber || quote.name || quote.id;

  const handleDelete = async () => {
    try {
      await deleteQuoteMutation.mutateAsync(quote.id);
      toast.success('Quote deleted successfully');
      onDeleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete quote');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-[var(--border)]">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Delete Quote</h3>
            <p className="text-sm text-[var(--muted-foreground)]">This action cannot be undone</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[var(--foreground)]">
            Are you sure you want to delete quote{' '}
            <span className="font-semibold">{displayName}</span>?
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            This will permanently remove the quote and all its associated data.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={deleteQuoteMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-[var(--muted)]/80 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteQuoteMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleteQuoteMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Deleting...
              </>
            ) : (
              'Delete Quote'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
