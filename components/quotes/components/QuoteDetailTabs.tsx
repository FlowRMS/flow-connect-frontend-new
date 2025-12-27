'use client';

import React from 'react';
import type { Quote, ColumnKey } from '../types';

type DetailTab = 'lines' | 'approvals' | 'recipients' | 'distributors' | 'submittals' | 'notes' | 'tasks' | 'activity' | 'linkedObjects' | 'versions' | 'settings';

interface SavedView {
  id: string;
  name: string;
  columns: ColumnKey[];
}

interface QuoteDetailTabsProps {
  selectedQuote: Quote;
  quoteLineItemsCount: number;
  quoteViewMode: 'simple' | 'overage';
  detailTab: DetailTab;
  setDetailTab: (tab: DetailTab) => void;
  showViewsMenu: boolean;
  setShowViewsMenu: (show: boolean) => void;
  showColumnsMenu: boolean;
  setShowColumnsMenu: (show: boolean) => void;
  savedViews: SavedView[];
  activeView: string;
  applyView: (viewId: string) => void;
  deleteView: (viewId: string) => void;
  setShowSaveViewModal: (show: boolean) => void;
  showSections: boolean;
  setShowSectionsModal: (show: boolean) => void;
  effectiveVisibleColumnsSize: number;
}

export function QuoteDetailTabs({
  selectedQuote,
  quoteLineItemsCount,
  quoteViewMode,
  detailTab,
  setDetailTab,
  showViewsMenu,
  setShowViewsMenu,
  showColumnsMenu,
  setShowColumnsMenu,
  savedViews,
  activeView,
  applyView,
  deleteView,
  setShowSaveViewModal,
  showSections,
  setShowSectionsModal,
  effectiveVisibleColumnsSize,
}: QuoteDetailTabsProps) {
  return (
    <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] flex-shrink-0 bg-white -mx-6 px-6 pt-4 -mt-6">
      <div className="flex gap-1 overflow-x-auto flex-shrink min-w-0">
        {[
          { id: 'lines', label: 'Line Items', count: quoteLineItemsCount },
          { id: 'approvals', label: 'Approvals', count: selectedQuote.pendingApprovals, hideInSimple: true },
          { id: 'recipients', label: 'Recipients', count: 4, hideInSimple: true },
          { id: 'submittals', label: 'Submittals', hideInSimple: true },
          { id: 'notes', label: 'Notes' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'activity', label: 'Activity' },
          { id: 'linkedObjects', label: 'Linked Objects' },
          { id: 'versions', label: 'Versions' },
          { id: 'settings', label: 'Settings' },
        ].filter(tab => !(quoteViewMode === 'simple' && tab.hideInSimple)).map(tab => (
          <button
            key={tab.id}
            onClick={() => setDetailTab(tab.id as DetailTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              detailTab === tab.id
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                tab.id === 'approvals' && selectedQuote.approvalStatus !== 'clear'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* View Controls - moved to tab row */}
      {detailTab === 'lines' && (
        <div className="flex items-center gap-3 pb-2 flex-shrink-0">
          {/* Views Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowViewsMenu(!showViewsMenu); setShowColumnsMenu(false); }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="14" height="14" rx="2"/>
                <path d="M3 8h14M8 8v9"/>
              </svg>
              {savedViews.find(v => v.id === activeView)?.name || 'Custom'}
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showViewsMenu && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                <div className="p-2 border-b border-[var(--border)]">
                  <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-2">Saved Views</p>
                </div>
                {savedViews.map(view => {
                  // Grey out "Earnings View" as Coming Soon
                  const isEarningsView = view.id === 'earnings';
                  return (
                    <div key={view.id} className={`flex items-center justify-between ${isEarningsView ? '' : 'hover:bg-[var(--muted)]'} transition-colors`}>
                      {isEarningsView ? (
                        <div className="flex-1 px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center justify-between">
                          <span>{view.name}</span>
                          <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Coming Soon</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => applyView(view.id)}
                          className={`flex-1 text-left px-4 py-2 text-sm ${activeView === view.id ? 'text-[var(--primary)] font-medium' : ''}`}
                        >
                          {view.name}
                          {activeView === view.id && (
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline ml-2">
                              <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      )}
                      {!['default', 'compact', 'pricing', 'approval', 'earnings'].includes(view.id) && (
                        <button
                          onClick={() => deleteView(view.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded mr-1"
                          title="Delete view"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
                <div className="border-t border-[var(--border)] p-2">
                  <button
                    onClick={() => { setShowSaveViewModal(true); setShowViewsMenu(false); }}
                    className="w-full text-left px-2 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-colors flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Save Current View...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sections Button - Coming Soon */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg text-gray-400 cursor-not-allowed bg-gray-50"
            title="Coming Soon"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
              <rect x="3" y="3" width="14" height="4" rx="1"/>
              <rect x="3" y="10" width="14" height="7" rx="1"/>
            </svg>
            Sections
            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Coming Soon</span>
          </div>

          {/* Columns Button */}
          <button
            onClick={() => { setShowColumnsMenu(true); setShowViewsMenu(false); }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round"/>
            </svg>
            Columns
            <span className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">{effectiveVisibleColumnsSize}</span>
          </button>
        </div>
      )}
    </div>
  );
}
