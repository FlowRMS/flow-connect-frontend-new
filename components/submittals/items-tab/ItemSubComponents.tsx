'use client';

import React from 'react';
import type { SubmittalItem } from '../../../lib/types/submittals';
import { matchStatusLabels, matchStatusColors } from '../../../lib/data/submittals-mock';
import { SearchableDropdownV2 } from '../../quotes-v2/components/SearchableDropdownV2';

interface EditItemValues {
  partNumber: string;
  manufacturer: string;
  description: string;
  quantity: number;
}

// Item Header Component
interface ItemHeaderProps {
  selectedItem: SubmittalItem;
  isEditing: boolean;
  editValues: EditItemValues;
  setEditValues: React.Dispatch<React.SetStateAction<EditItemValues>>;
  manufacturerOptions: { id: string; label: string }[];
  isLoadingFactories: boolean;
  isEditingItem?: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDeleteItem?: (itemId: string) => void;
}

export function ItemHeader({
  selectedItem,
  isEditing,
  editValues,
  setEditValues,
  manufacturerOptions,
  isLoadingFactories,
  isEditingItem,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteItem,
}: ItemHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex-1 mr-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl font-semibold text-[var(--foreground)]">{selectedItem.fixtureType}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${matchStatusColors[selectedItem.matchStatus].bg} ${matchStatusColors[selectedItem.matchStatus].text}`}>
            {matchStatusLabels[selectedItem.matchStatus]}
          </span>
        </div>
        {isEditing ? (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Part Number</label>
              <input
                type="text"
                value={editValues.partNumber}
                onChange={(e) => setEditValues(prev => ({ ...prev, partNumber: e.target.value }))}
                className="w-full px-2 py-1 text-lg font-medium border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                placeholder="Part number"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Manufacturer</label>
              <SearchableDropdownV2
                value={editValues.manufacturer}
                displayValue={editValues.manufacturer}
                onChange={(id, label) => setEditValues(prev => ({ ...prev, manufacturer: label }))}
                options={manufacturerOptions}
                placeholder="Search manufacturer..."
                isLoading={isLoadingFactories}
              />
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-medium text-[var(--foreground)]">{selectedItem.catalogNumber}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">{selectedItem.manufacturer}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <button onClick={onCancelEdit} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              Cancel
            </button>
            <button
              onClick={onSaveEdit}
              disabled={isEditingItem}
              className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isEditingItem && (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Save
            </button>
          </>
        ) : (
          <>
            <button onClick={onStartEdit} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)]" title="Edit item">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 010 3L12 12l-4 1 1-4 6.5-6.5a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={() => onDeleteItem?.(selectedItem.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500" title="Delete item">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h14M8 6V4h4v2M17 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Item Details Component
interface ItemDetailsProps {
  selectedItem: SubmittalItem;
  isEditing: boolean;
  editValues: EditItemValues;
  setEditValues: React.Dispatch<React.SetStateAction<EditItemValues>>;
}

export function ItemDetails({ selectedItem, isEditing, editValues, setEditValues }: ItemDetailsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-[var(--muted)]/30 rounded-lg p-4">
        <span className="text-xs text-[var(--muted-foreground)]">Description</span>
        {isEditing ? (
          <textarea
            value={editValues.description}
            onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
            className="w-full mt-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
            rows={3}
          />
        ) : (
          <p className="text-sm text-[var(--foreground)] mt-1">{selectedItem.description}</p>
        )}
      </div>
      <div className="bg-[var(--muted)]/30 rounded-lg p-4">
        <span className="text-xs text-[var(--muted-foreground)]">Quantity</span>
        {isEditing ? (
          <input
            type="number"
            value={editValues.quantity}
            onChange={(e) => setEditValues(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            className="w-full mt-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            min={0}
          />
        ) : (
          <p className="text-sm text-[var(--foreground)] mt-1">{selectedItem.quantity || '-'}</p>
        )}
      </div>
    </div>
  );
}

// No Spec Sheet Placeholder
export function NoSpecSheetPlaceholder({ onBrowseLibrary, onUploadNew }: { onBrowseLibrary: () => void; onUploadNew?: () => void }) {
  return (
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
        <button
          onClick={onUploadNew}
          className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          Upload New
        </button>
      </div>
    </div>
  );
}

// Empty Item State
export function EmptyItemState() {
  return (
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
  );
}

// Export the EditItemValues type for use in parent component
export type { EditItemValues };
