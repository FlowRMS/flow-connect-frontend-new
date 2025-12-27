'use client';

import React from 'react';
import type { Quote, LineItem } from '../types';

interface QuoteDetailHeaderProps {
  selectedQuote: Quote;
  setSelectedQuote: (quote: Quote | null) => void;
  onBack?: () => void; // Optional callback for back navigation
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  quoteLineItems: LineItem[];
  showActionsDropdown: boolean;
  setShowActionsDropdown: (show: boolean) => void;
  showStageDropdown: boolean;
  setShowStageDropdown: (show: boolean) => void;
  showVersionDropdown: boolean;
  setShowVersionDropdown: (show: boolean) => void;
  showViewModeDropdown: boolean;
  setShowViewModeDropdown: (show: boolean) => void;
  showSaveDropdown: boolean;
  setShowSaveDropdown: (show: boolean) => void;
  quoteViewMode: 'simple' | 'overage';
  setQuoteViewMode: (mode: 'simple' | 'overage') => void;
  adminShowSalesCredit: boolean;
  getStageColor: (stage: string) => string;
  setShowMarkAsLostModal: (show: boolean) => void;
  setSelectedQuotesForBulk: React.Dispatch<React.SetStateAction<Set<string>>>;
  setShowCreditModal: (show: boolean) => void;
  setShowQuotePdfPreview: (show: boolean) => void;
  setShowConvertToOrderModal: (show: boolean) => void;
  setShowCreateOrderFromQuoteModal: (show: boolean) => void;
  setCreateOrderSelectedItems: (items: { id: string; selected: boolean; quantity: number }[]) => void;
  setCreateOrderSelectAll: (selectAll: boolean) => void;
  setShowDuplicateQuoteModal: (show: boolean) => void;
  setDuplicateQuoteNumber: (number: string) => void;
  setDuplicateCustomer: (customer: string) => void;
  setDuplicatePercentIncrease: (percent: number) => void;
  setDuplicateCopyNotes: (copy: boolean) => void;
  onSaveQuote?: () => Promise<void>; // Handler for saving quote
  isSaving?: boolean; // Loading state for save
}

export function QuoteDetailHeader({
  selectedQuote,
  setSelectedQuote,
  onBack,
  setQuotes,
  quoteLineItems,
  showActionsDropdown,
  setShowActionsDropdown,
  showStageDropdown,
  setShowStageDropdown,
  showVersionDropdown,
  setShowVersionDropdown,
  showViewModeDropdown,
  setShowViewModeDropdown,
  showSaveDropdown,
  setShowSaveDropdown,
  quoteViewMode,
  setQuoteViewMode,
  adminShowSalesCredit,
  getStageColor,
  setShowMarkAsLostModal,
  setSelectedQuotesForBulk,
  setShowCreditModal,
  setShowQuotePdfPreview,
  setShowConvertToOrderModal,
  setShowCreateOrderFromQuoteModal,
  setCreateOrderSelectedItems,
  setCreateOrderSelectAll,
  setShowDuplicateQuoteModal,
  setDuplicateQuoteNumber,
  setDuplicateCustomer,
  setDuplicatePercentIncrease,
  setDuplicateCopyNotes,
  onSaveQuote,
  isSaving = false,
}: QuoteDetailHeaderProps) {
  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setSelectedQuote(null);
    }
  };
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
              title="Back to Quotes"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{selectedQuote.id}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowActionsDropdown(!showActionsDropdown);
                setShowStageDropdown(false);
                setShowVersionDropdown(false);
                setShowViewModeDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Actions
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showActionsDropdown && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                {/* Create Order - Coming Soon */}
                <div
                  className="w-full px-4 py-2 text-left text-sm text-gray-400 cursor-not-allowed rounded-t-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                      <path d="M3 7l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 4v10" strokeLinecap="round"/>
                    </svg>
                    Create Order
                  </div>
                  <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Coming Soon</span>
                </div>
                <button
                  onClick={() => {
                    // Initialize duplicate modal with default values
                    setDuplicateQuoteNumber(`${selectedQuote.name}-1`);
                    setDuplicateCustomer('');
                    setDuplicatePercentIncrease(0);
                    setDuplicateCopyNotes(true);
                    setShowDuplicateQuoteModal(true);
                    setShowActionsDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                    <path d="M4 14V4a2 2 0 012-2h10"/>
                  </svg>
                  Duplicate Quote
                </button>
              </div>
            )}
          </div>

          {/* Stage Dropdown - styled like a button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStageDropdown(!showStageDropdown);
                setShowActionsDropdown(false);
                setShowVersionDropdown(false);
                setShowViewModeDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStageColor(selectedQuote.stage)}`}
            >
              {selectedQuote.stage}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showStageDropdown && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                {['Draft', 'Review', 'Sent', 'Negotiating', 'Won', 'Lost', 'Dormant'].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => {
                      if (stage === 'Lost') {
                        // Open Mark as Lost modal for single quote
                        setSelectedQuotesForBulk(new Set([selectedQuote.id]));
                        setShowMarkAsLostModal(true);
                        setShowStageDropdown(false);
                      } else {
                        const newStage = stage as Quote['stage'];
                        setSelectedQuote({ ...selectedQuote, stage: newStage });
                        setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, stage: newStage } : q));
                        setShowStageDropdown(false);
                      }
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                      selectedQuote.stage === stage ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                    } ${stage === 'Lost' ? 'text-red-600' : ''}`}
                  >
                    {stage}
                    {selectedQuote.stage === stage && (
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Version Dropdown - Coming Soon */}
          <div className="relative">
            <div
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed bg-gray-50"
              title="Coming Soon"
            >
              v{selectedQuote.version}
              <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Coming Soon</span>
            </div>
          </div>

          {/* Sale Credit Button - only show when admin setting is enabled */}
          {adminShowSalesCredit && (
            <button
              onClick={() => setShowCreditModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sale Credit
            </button>
          )}

          {/* View Mode Dropdown - Coming Soon */}
          <div className="relative">
            <div
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed bg-gray-50"
              title="Coming Soon"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                <path d="M1 10s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="3"/>
              </svg>
              {quoteViewMode === 'overage' ? 'Overage View' : 'Simple View'}
              <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Coming Soon</span>
            </div>
          </div>

          {/* Generate PDF Button */}
          <button
            onClick={() => setShowQuotePdfPreview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round"/>
            </svg>
            PDF
          </button>

          {/* Convert to Order Button */}
          {selectedQuote.stage === 'Won' && (
            <button
              onClick={() => setShowConvertToOrderModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 4v10" strokeLinecap="round"/>
              </svg>
              Convert to Order
            </button>
          )}

          {/* Save Button with Dropdown */}
          <div className="relative">
            <div className="flex">
              <button
                onClick={() => onSaveQuote?.()}
                disabled={isSaving}
                className={`px-4 py-2 text-white rounded-l-lg transition-colors text-sm font-medium ${
                  isSaving
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                disabled={isSaving}
                className={`px-2 py-2 text-white rounded-r-lg transition-colors border-l border-green-500 ${
                  isSaving
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {showSaveDropdown && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { onSaveQuote?.(); setShowSaveDropdown(false); }}
                  disabled={isSaving}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                {/* Save as New Version - Coming Soon */}
                <div
                  className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed rounded-b-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Save as New Version
                  </div>
                  <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Coming Soon</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
