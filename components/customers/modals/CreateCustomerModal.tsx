/**
 * Create Customer Modal Component
 * Modal for creating new customers with split rates for inside/outside reps
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useCreateCustomer } from '../api/useCustomersApi';
import { toast } from 'sonner';
import {
  SplitRatesInput,
  entriesToSplitRateInputs,
  type SplitRateEntry,
} from '../components/SplitRatesInput';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCustomerModal({ isOpen, onClose, onSuccess }: CreateCustomerModalProps) {
  // Basic customer fields
  const [companyName, setCompanyName] = useState('');
  const [isParent, setIsParent] = useState(false);
  const [published, setPublished] = useState(true);

  // Split rates for inside and outside reps
  const [insideRepEntries, setInsideRepEntries] = useState<SplitRateEntry[]>([]);
  const [outsideRepEntries, setOutsideRepEntries] = useState<SplitRateEntry[]>([]);

  const createMutation = useCreateCustomer();

  // Calculate totals for validation
  const insideTotal = useMemo(() =>
    insideRepEntries.reduce((sum, e) => sum + (parseFloat(e.splitRate) || 0), 0),
    [insideRepEntries]
  );

  const outsideTotal = useMemo(() =>
    outsideRepEntries.reduce((sum, e) => sum + (parseFloat(e.splitRate) || 0), 0),
    [outsideRepEntries]
  );

  // Validation: Each rep type must independently total 100% (if it has entries)
  const hasInsideReps = insideRepEntries.length > 0;
  const hasOutsideReps = outsideRepEntries.length > 0;
  const isInsideValid = !hasInsideReps || insideTotal === 100;
  const isOutsideValid = !hasOutsideReps || outsideTotal === 100;
  const isValidSplitRate = isInsideValid && isOutsideValid;

  // Check if any reps have been added but not fully configured
  const hasIncompleteEntries = useMemo(() => {
    const allEntries = [...insideRepEntries, ...outsideRepEntries];
    return allEntries.some(entry => entry.userId && !entry.splitRate);
  }, [insideRepEntries, outsideRepEntries]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (!isValidSplitRate) {
      if (!isInsideValid && !isOutsideValid) {
        toast.error('Both Inside Reps and Outside Reps must each total exactly 100%');
      } else if (!isInsideValid) {
        toast.error('Inside Reps split rate must total exactly 100%');
      } else {
        toast.error('Outside Reps split rate must total exactly 100%');
      }
      return;
    }

    if (hasIncompleteEntries) {
      toast.error('Please enter split rates for all selected reps');
      return;
    }

    try {
      // Combine inside and outside rep entries into split rates
      const insideSplitRates = entriesToSplitRateInputs(insideRepEntries, 'INSIDE');
      const outsideSplitRates = entriesToSplitRateInputs(outsideRepEntries, 'OUTSIDE');
      const allSplitRates = [...insideSplitRates, ...outsideSplitRates];

      await createMutation.mutateAsync({
        companyName: companyName.trim(),
        isParent,
        published,
        splitRates: allSplitRates.length > 0 ? allSplitRates : undefined,
      });

      toast.success('Customer created successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create customer');
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setIsParent(false);
    setPublished(true);
    setInsideRepEntries([]);
    setOutsideRepEntries([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const labelClass = "flex items-center gap-2 text-sm font-medium text-[var(--foreground)] mb-2";
  const inputClass = "w-full px-4 py-3 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all placeholder:text-[var(--muted-foreground)]";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={handleClose}>
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[var(--muted)]/30 px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Create New Customer</h2>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] hidden sm:block">Add a new customer with sales rep assignments</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Customer Details Section */}
            <div className="bg-[var(--muted)]/30 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Customer Details
              </h3>

              {/* Company Name */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputClass}
                  placeholder="Enter company name..."
                />
              </div>

            </div>

            {/* Sales Representatives Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Sales Representatives
                </h3>

                {/* Split Rate Summary - Each type must be 100% independently */}
                <div className="flex items-center gap-2">
                  {hasInsideReps && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      insideTotal === 100
                        ? 'bg-green-100 text-green-700'
                        : insideTotal > 100
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Inside: {insideTotal.toFixed(1)}%
                    </div>
                  )}
                  {hasOutsideReps && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      outsideTotal === 100
                        ? 'bg-green-100 text-green-700'
                        : outsideTotal > 100
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Outside: {outsideTotal.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Inside Reps */}
              <SplitRatesInput
                repType="INSIDE"
                entries={insideRepEntries}
                onChange={setInsideRepEntries}
                disabled={createMutation.isPending}
              />

              {/* Outside Reps */}
              <SplitRatesInput
                repType="OUTSIDE"
                entries={outsideRepEntries}
                onChange={setOutsideRepEntries}
                disabled={createMutation.isPending}
              />
            </div>

            {/* Settings Section */}
            <div className="bg-[var(--muted)]/30 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </h3>

              {/* Is Parent Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)]">Parent Customer</label>
                  <p className="text-xs text-[var(--muted-foreground)]">Mark as a parent customer that can have child customers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsParent(!isParent)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isParent ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isParent ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)]">Published</label>
                  <p className="text-xs text-[var(--muted-foreground)]">Make this customer visible and active</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPublished(!published)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    published ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[var(--card)] px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
            <div className="text-xs sm:text-sm text-[var(--muted-foreground)] hidden sm:block">
              <span className="text-red-500">*</span> Required fields
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-xs sm:text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !companyName.trim() || !isValidSplitRate}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 bg-[var(--primary)] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span className="hidden sm:inline">Creating...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Create Customer</span>
                    <span className="sm:hidden">Create</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
