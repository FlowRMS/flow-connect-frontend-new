'use client';

import React, { useState } from 'react';
import type { SpecSheet, HighlightRegion } from '../../lib/types/submittals';
import HighlightEditor from './HighlightEditor';
import { DetailsTab, HighlightsTab, useHighlightPanel } from './detail-panel';

interface SpecSheetDetailPanelProps {
  specSheet: SpecSheet;
  highlightCount: number;
  onClose: () => void;
  onHighlightSave?: (catalogNumber: string, manufacturer: string, regions: HighlightRegion[]) => void;
}

export default function SpecSheetDetailPanel({ specSheet, highlightCount, onClose, onHighlightSave }: SpecSheetDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'highlights'>('details');

  const highlightPanel = useHighlightPanel({ specSheet, onHighlightSave });

  return (
    <div className="w-96 border-l border-[var(--border)] bg-[var(--card)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--foreground)] truncate pr-2">Spec Sheet Details</h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Preview */}
      <div className="aspect-[4/3] bg-[var(--muted)] flex items-center justify-center relative border-b border-[var(--border)]">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--muted-foreground)]">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9H8M10 13H8M14 13h-4M14 17H8" strokeLinecap="round"/>
        </svg>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">
            {specSheet.pageCount} pages
          </span>
          <button className="flex items-center gap-1 text-xs bg-[var(--primary)] text-white px-3 py-1.5 rounded hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 9-8 9 8 9 8-4 8-9 8-9-8-9-8z"/>
              <circle cx="10" cy="12" r="3"/>
            </svg>
            Preview
          </button>
        </div>
        {specSheet.needsReview && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4M10 14h.01"/>
              </svg>
              Needs Review
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'highlights'
              ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Highlights ({highlightCount})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'details' ? (
          <DetailsTab specSheet={specSheet} highlightCount={highlightCount} />
        ) : (
          <HighlightsTab
            highlights={highlightPanel.highlights}
            showNewHighlightForm={highlightPanel.showNewHighlightForm}
            newHighlightCatalog={highlightPanel.newHighlightCatalog}
            setNewHighlightCatalog={highlightPanel.setNewHighlightCatalog}
            setShowNewHighlightForm={highlightPanel.setShowNewHighlightForm}
            handleAddHighlight={highlightPanel.handleAddHighlight}
            handleEditHighlight={highlightPanel.handleEditHighlight}
            handleCancelNewForm={highlightPanel.handleCancelNewForm}
          />
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[var(--border)] space-y-2">
        <button
          onClick={() => {
            setActiveTab('highlights');
            highlightPanel.setShowNewHighlightForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Add Highlight
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M12 18v-6M9 15l3 3 3-3"/>
            </svg>
            Replace PDF
          </button>
          <button className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M8 6V4h4v2M5 6v12a2 2 0 002 2h6a2 2 0 002-2V6"/>
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Highlight Editor Modal */}
      {highlightPanel.showHighlightEditor && (
        <HighlightEditor
          specSheet={specSheet}
          catalogNumber={highlightPanel.editingHighlight?.catalogNumber || highlightPanel.newHighlightCatalog}
          manufacturer={highlightPanel.editingHighlight?.manufacturer || specSheet.manufacturer}
          existingHighlight={highlightPanel.editingHighlight}
          onSave={highlightPanel.handleSaveHighlight}
          onClose={highlightPanel.handleCloseEditor}
        />
      )}
    </div>
  );
}
