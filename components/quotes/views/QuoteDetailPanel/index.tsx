'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Quote, LineItem, Section, DetailTabType } from '../../types';
import type { Submittal } from '../../../../lib/types/submittals';
import { mockLineItems, mockSections } from '../../data';

// ============================================
// PROPS INTERFACE
// ============================================
interface QuoteDetailPanelProps {
  quote: Quote;
  onBack: () => void;
  onQuoteUpdate: (updates: Partial<Quote>) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const getStageColor = (stage: string) => {
  switch (stage) {
    case 'Draft':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    case 'Review':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
    case 'Sent':
      return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
    case 'Negotiating':
      return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
    case 'Won':
      return 'bg-green-100 text-green-700 hover:bg-green-200';
    case 'Lost':
      return 'bg-red-100 text-red-700 hover:bg-red-200';
    case 'Dormant':
      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  }
};

// ============================================
// MAIN COMPONENT
// ============================================
export function QuoteDetailPanel({ quote, onBack, onQuoteUpdate }: QuoteDetailPanelProps) {
  // ============================================
  // STATE
  // ============================================
  const [detailTab, setDetailTab] = useState<DetailTabType>('lines');
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [quoteViewMode, setQuoteViewMode] = useState<'overage' | 'simple'>('simple');

  // Line items for this quote
  const [quoteLineItems, setQuoteLineItems] = useState<LineItem[]>([]);
  const [quoteSections, setQuoteSections] = useState<Section[]>(mockSections);

  // ============================================
  // EFFECTS
  // ============================================
  // Sync line items when quote changes
  useEffect(() => {
    setQuoteLineItems(mockLineItems.filter(li => li.quoteId === quote.id));
  }, [quote.id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowStageDropdown(false);
        setShowActionsDropdown(false);
        setShowVersionDropdown(false);
        setShowViewModeDropdown(false);
        setShowSaveDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  // Calculate totals
  const totals = useMemo(() => {
    return quoteLineItems.reduce(
      (acc, item) => {
        const baseTotal = item.basePrice * item.quantity;
        const sellTotal = item.sellPrice * item.quantity;
        const commission = sellTotal * (item.manufacturers[0]?.commissionRate || 0.08);
        const overage = sellTotal - baseTotal;

        return {
          baseTotal: acc.baseTotal + baseTotal,
          sellTotal: acc.sellTotal + sellTotal,
          commission: acc.commission + commission,
          overage: acc.overage + overage,
        };
      },
      { baseTotal: 0, sellTotal: 0, commission: 0, overage: 0 }
    );
  }, [quoteLineItems]);

  // Tab configuration
  const tabs: { id: DetailTabType; label: string; count?: number; hideInSimple?: boolean }[] = [
    { id: 'lines', label: 'Line Items', count: quoteLineItems.length },
    { id: 'approvals', label: 'Approvals', count: quote.pendingApprovals, hideInSimple: true },
    { id: 'recipients', label: 'Recipients', hideInSimple: true },
    { id: 'distributors', label: 'Distributors', hideInSimple: true },
    { id: 'linkedObjects', label: 'Linked Objects' },
    { id: 'versions', label: 'Versions' },
    { id: 'notes', label: 'Notes' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'activity', label: 'Activity' },
    { id: 'settings', label: 'Settings' },
    { id: 'submittals', label: 'Submittals', hideInSimple: true },
  ];

  const filteredTabs = tabs.filter(tab => !(quoteViewMode === 'simple' && tab.hideInSimple));

  // Stage options
  const stageOptions = ['Draft', 'Review', 'Sent', 'Negotiating', 'Won', 'Lost', 'Dormant'];

  // ============================================
  // HANDLERS
  // ============================================
  const handleStageChange = useCallback((newStage: Quote['stage']) => {
    onQuoteUpdate({ stage: newStage });
    setShowStageDropdown(false);
  }, [onQuoteUpdate]);

  const handleVersionChange = useCallback((newVersion: number) => {
    onQuoteUpdate({ version: newVersion });
    setShowVersionDropdown(false);
  }, [onQuoteUpdate]);

  const handleCreateOrder = useCallback(() => {
    // TODO: Open create order modal
    alert('Create Order functionality will be implemented');
    setShowActionsDropdown(false);
  }, []);

  const handleDuplicateQuote = useCallback(() => {
    // TODO: Open duplicate quote modal
    alert('Duplicate Quote functionality will be implemented');
    setShowActionsDropdown(false);
  }, []);

  const handleSave = useCallback(() => {
    alert('Quote saved!');
    setShowSaveDropdown(false);
  }, []);

  const handleSaveAsNewVersion = useCallback(() => {
    const newVersion = quote.version + 1;
    onQuoteUpdate({ version: newVersion });
    alert(`Saved as v${newVersion}`);
    setShowSaveDropdown(false);
  }, [quote.version, onQuoteUpdate]);

  const handleGeneratePDF = useCallback(() => {
    // TODO: Open PDF preview modal
    alert('PDF generation will be implemented');
  }, []);

  const handleConvertToOrder = useCallback(() => {
    // TODO: Open convert to order modal
    alert('Convert to Order functionality will be implemented');
  }, []);

  // ============================================
  // RENDER
  // ============================================
  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
                title="Back to Quotes"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{quote.id}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Actions Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
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
                <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <button
                    onClick={handleCreateOrder}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 4v10" strokeLinecap="round"/>
                    </svg>
                    Create Order
                  </button>
                  <button
                    onClick={handleDuplicateQuote}
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

            {/* Stage Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStageDropdown(!showStageDropdown);
                  setShowActionsDropdown(false);
                  setShowVersionDropdown(false);
                  setShowViewModeDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStageColor(quote.stage)}`}
              >
                {quote.stage}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showStageDropdown && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  {stageOptions.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => handleStageChange(stage as Quote['stage'])}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                        quote.stage === stage ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                      } ${stage === 'Lost' ? 'text-red-600' : ''}`}
                    >
                      {stage}
                      {quote.stage === stage && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Version Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVersionDropdown(!showVersionDropdown);
                  setShowActionsDropdown(false);
                  setShowStageDropdown(false);
                  setShowViewModeDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                v{quote.version}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showVersionDropdown && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  {[...Array(quote.version)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handleVersionChange(i + 1)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                        quote.version === i + 1 ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                      }`}
                    >
                      v{i + 1}
                      {quote.version === i + 1 && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewModeDropdown(!showViewModeDropdown);
                  setShowActionsDropdown(false);
                  setShowStageDropdown(false);
                  setShowVersionDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 10s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="3"/>
                </svg>
                {quoteViewMode === 'overage' ? 'Overage View' : 'Simple View'}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showViewModeDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setQuoteViewMode('overage');
                      setShowViewModeDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center justify-between ${
                      quoteViewMode === 'overage' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                    }`}
                  >
                    Overage View
                    {quoteViewMode === 'overage' && (
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setQuoteViewMode('simple');
                      setShowViewModeDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-center justify-between ${
                      quoteViewMode === 'simple' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                    }`}
                  >
                    Simple View
                    {quoteViewMode === 'simple' && (
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Generate PDF Button */}
            <button
              onClick={handleGeneratePDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round"/>
              </svg>
              PDF
            </button>

            {/* Convert to Order Button - Only show when Won */}
            {quote.stage === 'Won' && (
              <button
                onClick={handleConvertToOrder}
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
            <div className="relative dropdown-container">
              <div className="flex">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-l-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSaveDropdown(!showSaveDropdown);
                  }}
                  className="px-2 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors border-l border-green-500"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {showSaveDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleSave}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleSaveAsNewVersion}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Save as New Version
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Summary Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0 px-6 py-2 flex items-center justify-end">
        <div className="relative group">
          <div className="flex items-center gap-3 text-xs cursor-pointer">
            <span className="text-[var(--muted-foreground)]">
              Base Price: <span className="font-medium text-[var(--foreground)]">${totals.baseTotal.toLocaleString()}</span>
            </span>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              Sell Price: <span className="font-semibold text-[var(--foreground)]">${totals.sellTotal.toLocaleString()}</span>
            </span>
            <span className="text-[var(--muted-foreground)]">|</span>
            <span className="text-[var(--muted-foreground)]">
              Commission: <span className="font-medium text-purple-600">${totals.commission.toLocaleString()}</span>
            </span>
            {quoteViewMode === 'overage' && (
              <>
                <span className="text-[var(--muted-foreground)]">|</span>
                <span className="text-[var(--muted-foreground)]">
                  Overage: <span className="font-medium text-orange-600">${totals.overage.toLocaleString()} ({totals.baseTotal > 0 ? ((totals.overage / totals.baseTotal) * 100).toFixed(1) : 0}%)</span>
                </span>
                <span className="text-[var(--muted-foreground)]">|</span>
                <span className="text-[var(--muted-foreground)]">
                  Earnings: <span className="font-semibold text-green-600">${(totals.overage + totals.commission).toLocaleString()} ({totals.sellTotal > 0 ? (((totals.overage + totals.commission) / totals.sellTotal) * 100).toFixed(1) : 0}%)</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-6">
        <div className="flex gap-1 overflow-x-auto">
          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setDetailTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                detailTab === tab.id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  tab.id === 'approvals' && quote.approvalStatus !== 'clear'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Lines Tab */}
        {detailTab === 'lines' && (
          <div className="space-y-4">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="text-lg font-semibold mb-4">Line Items</h3>
              {quoteLineItems.length === 0 ? (
                <p className="text-[var(--muted-foreground)]">No line items found for this quote.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left py-2 px-3 font-semibold text-[var(--muted-foreground)]">Part #</th>
                        <th className="text-left py-2 px-3 font-semibold text-[var(--muted-foreground)]">Description</th>
                        <th className="text-left py-2 px-3 font-semibold text-[var(--muted-foreground)]">Manufacturer</th>
                        <th className="text-right py-2 px-3 font-semibold text-[var(--muted-foreground)]">Qty</th>
                        <th className="text-right py-2 px-3 font-semibold text-[var(--muted-foreground)]">Base Price</th>
                        <th className="text-right py-2 px-3 font-semibold text-[var(--muted-foreground)]">Sell Price</th>
                        <th className="text-right py-2 px-3 font-semibold text-[var(--muted-foreground)]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteLineItems.map(item => (
                        <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/20">
                          <td className="py-2 px-3 font-mono text-sm">{item.productNumber}</td>
                          <td className="py-2 px-3">{item.description}</td>
                          <td className="py-2 px-3">{item.manufacturers[0]?.name}</td>
                          <td className="py-2 px-3 text-right">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">${item.basePrice.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right">${item.sellPrice.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-medium">${(item.sellPrice * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {detailTab === 'approvals' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Approvals</h3>
            <p className="text-[var(--muted-foreground)]">Approval workflow and status will be displayed here.</p>
          </div>
        )}

        {/* Recipients Tab */}
        {detailTab === 'recipients' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Recipients</h3>
            <p className="text-[var(--muted-foreground)]">Quote recipients and their price levels will be displayed here.</p>
          </div>
        )}

        {/* Distributors Tab */}
        {detailTab === 'distributors' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Distributors</h3>
            <p className="text-[var(--muted-foreground)]">Distributor quotes and pricing matrix will be displayed here.</p>
          </div>
        )}

        {/* Linked Objects Tab */}
        {detailTab === 'linkedObjects' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Linked Objects</h3>
            <p className="text-[var(--muted-foreground)]">Pre-opportunities, orders, invoices, and other linked objects will be displayed here.</p>
          </div>
        )}

        {/* Versions Tab */}
        {detailTab === 'versions' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Versions</h3>
            <p className="text-[var(--muted-foreground)]">Quote version history will be displayed here. Current version: v{quote.version}</p>
          </div>
        )}

        {/* Notes Tab */}
        {detailTab === 'notes' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <p className="text-[var(--muted-foreground)]">Quote notes and comments will be displayed here.</p>
          </div>
        )}

        {/* Tasks Tab */}
        {detailTab === 'tasks' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Tasks</h3>
            <p className="text-[var(--muted-foreground)]">Tasks associated with this quote will be displayed here.</p>
          </div>
        )}

        {/* Activity Tab */}
        {detailTab === 'activity' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Activity</h3>
            <p className="text-[var(--muted-foreground)]">Quote activity log and timeline will be displayed here.</p>
          </div>
        )}

        {/* Settings Tab */}
        {detailTab === 'settings' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <p className="text-[var(--muted-foreground)]">Quote settings and configuration options will be displayed here.</p>
          </div>
        )}

        {/* Submittals Tab */}
        {detailTab === 'submittals' && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold mb-4">Submittals</h3>
            <p className="text-[var(--muted-foreground)]">Submittal packages and documents will be displayed here.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default QuoteDetailPanel;
