/**
 * Create Quote from Pre-Opportunity Modal Component
 * Two-step modal: First asks for quote number, then prompts to redirect
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateQuoteFromPreOpportunity } from '../../quotes/api/useQuotesApi';
import type { Quote } from '../../quotes/api/quotesApi';

interface CreateQuoteFromPreOppModalProps {
  isOpen: boolean;
  preOpportunityId: string;
  preOpportunityNumber: string;
  onClose: () => void;
  onSuccess?: (quote: Quote) => void;
}

type ModalStep = 'input' | 'success';

export function CreateQuoteFromPreOppModal({
  isOpen,
  preOpportunityId,
  preOpportunityNumber,
  onClose,
  onSuccess,
}: CreateQuoteFromPreOppModalProps) {
  const router = useRouter();
  const createQuoteMutation = useCreateQuoteFromPreOpportunity();

  const [step, setStep] = useState<ModalStep>('input');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [createdQuote, setCreatedQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!quoteNumber.trim()) {
      setError('Quote number is required');
      return;
    }

    setError(null);

    try {
      const quote = await createQuoteMutation.mutateAsync({
        preOpportunityId,
        quoteNumber: quoteNumber.trim(),
      });

      setCreatedQuote(quote);
      setStep('success');
      onSuccess?.(quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quote');
    }
  };

  const handleRedirectToQuote = () => {
    if (createdQuote) {
      router.push(`/quotes/${createdQuote.id}/edit`);
    }
    handleCloseAndReset();
  };

  const handleStayHere = () => {
    handleCloseAndReset();
  };

  const handleCloseAndReset = () => {
    setStep('input');
    setQuoteNumber('');
    setCreatedQuote(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {step === 'input' ? (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Quote</h3>
                  <p className="text-sm text-gray-500">From Pre-Opportunity {preOpportunityNumber}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => {
                  setQuoteNumber(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !createQuoteMutation.isPending) {
                    handleCreate();
                  }
                }}
                placeholder="Enter quote number..."
                className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                  error ? 'border-red-300' : 'border-gray-200'
                }`}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}
              <p className="mt-3 text-xs text-gray-500">
                A new quote will be created with all details from this pre-opportunity.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={handleCloseAndReset}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createQuoteMutation.isPending || !quoteNumber.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createQuoteMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Quote
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Success Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quote Created!</h3>
                  <p className="text-sm text-gray-500">Quote #{createdQuote?.quoteNumber}</p>
                </div>
              </div>
            </div>

            {/* Success Body */}
            <div className="px-6 py-6">
              <p className="text-sm text-gray-600 mb-4">
                Your quote has been successfully created from the pre-opportunity. Would you like to view and edit the new quote now?
              </p>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{createdQuote?.quoteNumber}</p>
                    <p className="text-xs text-gray-500">
                      Status: {createdQuote?.status} • {createdQuote?.details?.length || 0} line items
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={handleStayHere}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Stay Here
              </button>
              <button
                onClick={handleRedirectToQuote}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                View Quote
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
