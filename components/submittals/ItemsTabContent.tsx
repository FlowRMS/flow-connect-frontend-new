'use client';

import React from 'react';
import type { SubmittalItem, SpecSheet } from '../../lib/types/submittals';
import { matchStatusLabels, matchStatusColors } from '../../lib/data/submittals-mock';

interface ItemsTabContentProps {
  items: SubmittalItem[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  selectedItem: SubmittalItem | null;
  selectedItemSpecSheet: SpecSheet | null;
  onBrowseLibrary: () => void;
  onRemoveSpecSheet: (itemId: string) => void;
  onAddItem?: () => void;
  onDeleteItem?: (itemId: string) => void;
}

export function ItemsTabContent({
  items,
  selectedItemId,
  setSelectedItemId,
  selectedItem,
  selectedItemSpecSheet,
  onBrowseLibrary,
  onRemoveSpecSheet,
  onAddItem,
  onDeleteItem,
}: ItemsTabContentProps) {
  return (
    <>
      {/* Items List */}
      <div className="w-80 border-r border-[var(--border)] flex flex-col">
        <div className="p-3 border-b border-[var(--border)]">
          <button
            onClick={onAddItem}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-dashed border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Add Item
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              className={`px-4 py-3 border-b border-[var(--border)] cursor-pointer transition-colors ${
                selectedItemId === item.id
                  ? 'bg-[var(--primary)]/5 border-l-2 border-l-[var(--primary)]'
                  : 'hover:bg-[var(--muted)]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{item.fixtureType}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    item.matchStatus === 'matched_with_highlight' ? 'bg-green-500' :
                    item.matchStatus === 'matched_no_highlight' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">#{index + 1}</span>
              </div>
              <p className="text-sm text-[var(--foreground)] truncate">{item.catalogNumber}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">{item.manufacturer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Item Detail */}
      <div className="flex-1 overflow-y-auto">
        {selectedItem ? (
          <div className="p-6">
            {/* Item Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl font-semibold text-[var(--foreground)]">{selectedItem.fixtureType}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${matchStatusColors[selectedItem.matchStatus].bg} ${matchStatusColors[selectedItem.matchStatus].text}`}>
                    {matchStatusLabels[selectedItem.matchStatus]}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-[var(--foreground)]">{selectedItem.catalogNumber}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">{selectedItem.manufacturer}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)]">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 010 3L12 12l-4 1 1-4 6.5-6.5a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => onDeleteItem?.(selectedItem.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h14M8 6V4h4v2M17 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Item Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                <span className="text-xs text-[var(--muted-foreground)]">Description</span>
                <p className="text-sm text-[var(--foreground)] mt-1">{selectedItem.description}</p>
              </div>
              {selectedItem.quantity && (
                <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                  <span className="text-xs text-[var(--muted-foreground)]">Quantity</span>
                  <p className="text-sm text-[var(--foreground)] mt-1">{selectedItem.quantity}</p>
                </div>
              )}
            </div>

            {/* Spec Sheet Section */}
            <div className="border-t border-[var(--border)] pt-6">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">Spec Sheet</h4>

              {selectedItemSpecSheet ? (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="p-4 bg-[var(--muted)]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{selectedItemSpecSheet.displayName}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {selectedItemSpecSheet.pageCount} pages • {selectedItemSpecSheet.manufacturer}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                        Edit Highlights
                      </button>
                      <button
                        onClick={() => onRemoveSpecSheet(selectedItem.id)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Spec Sheet Preview Placeholder */}
                  <div className="h-64 bg-[var(--muted)]/20 flex items-center justify-center text-[var(--muted-foreground)]">
                    <div className="text-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 opacity-30">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6"/>
                      </svg>
                      <span className="text-sm">Spec sheet preview</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center">
                  <div className="w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2v6h6M12 18v-6M9 15h6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">No spec sheet attached</h4>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4">
                    Attach a spec sheet from your library or upload a new one
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={onBrowseLibrary}
                      className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      Browse Library
                    </button>
                    <button className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                      Upload New
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center p-6">
            <div>
              <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M10 9H8M10 13H8M14 13h-4M14 17H8"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Select an item</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Choose an item from the list to view and edit its details
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
