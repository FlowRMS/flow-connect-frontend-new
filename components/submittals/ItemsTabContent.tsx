'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { SubmittalItem, SpecSheet, HighlightRegion, HighlightShape } from '../../lib/types/submittals';
import { useFactories } from '../warehouse/api/useFactoriesApi';
import { useHighlightVersion } from './api/useSpecSheetsApi';
import { SpecSheetPreviewPanel } from './SpecSheetPreviewPanel';
import {
  ItemHeader,
  ItemDetails,
  NoSpecSheetPlaceholder,
  EmptyItemState,
  type EditItemValues,
} from './items-tab';

interface ItemsTabContentProps {
  items: SubmittalItem[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  selectedItem: SubmittalItem | null;
  selectedItemSpecSheet: SpecSheet | null;
  onBrowseLibrary: () => void;
  onRemoveSpecSheet: (itemId: string) => void | Promise<void>;
  onEditHighlights?: () => void;
  onAddItem?: () => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string, values: { partNumber?: string; manufacturer?: string; description?: string; quantity?: number }) => void | Promise<void>;
  isEditingItem?: boolean;
  onUploadNew?: () => void;
}

export function ItemsTabContent({
  items,
  selectedItemId,
  setSelectedItemId,
  selectedItem,
  selectedItemSpecSheet,
  onBrowseLibrary,
  onRemoveSpecSheet,
  onEditHighlights,
  onAddItem,
  onDeleteItem,
  onEditItem,
  isEditingItem,
  onUploadNew,
}: ItemsTabContentProps) {
  const { data: factories, isLoading: isLoadingFactories } = useFactories();

  // Fetch highlight version data (with regions) for the selected item
  const { data: highlightVersionData } = useHighlightVersion(
    selectedItem?.highlightDefinitionId || null
  );

  const manufacturerOptions = useMemo(() => {
    if (!factories) return [];
    return factories.map(factory => ({
      id: factory.title,
      label: factory.title,
    }));
  }, [factories]);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<EditItemValues>({
    partNumber: '',
    manufacturer: '',
    description: '',
    quantity: 0,
  });

  useEffect(() => {
    setIsEditing(false);
    if (selectedItem) {
      setEditValues({
        partNumber: selectedItem.catalogNumber || '',
        manufacturer: selectedItem.manufacturer || '',
        description: selectedItem.description || '',
        quantity: selectedItem.quantity || 0,
      });
    }
  }, [selectedItemId, selectedItem]);

  const handleStartEdit = () => {
    if (selectedItem) {
      setEditValues({
        partNumber: selectedItem.catalogNumber || '',
        manufacturer: selectedItem.manufacturer || '',
        description: selectedItem.description || '',
        quantity: selectedItem.quantity || 0,
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedItem) {
      setEditValues({
        partNumber: selectedItem.catalogNumber || '',
        manufacturer: selectedItem.manufacturer || '',
        description: selectedItem.description || '',
        quantity: selectedItem.quantity || 0,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (selectedItem && onEditItem) {
      await onEditItem(selectedItem.id, {
        partNumber: editValues.partNumber,
        manufacturer: editValues.manufacturer,
        description: editValues.description,
        quantity: editValues.quantity,
      });
      setIsEditing(false);
    }
  };

  // Map highlight regions from API response to the format expected by the viewer
  const highlightRegions: HighlightRegion[] = useMemo(() => {
    if (!highlightVersionData?.regions) return [];
    return highlightVersionData.regions.map(region => ({
      id: region.id,
      pageNumber: region.pageNumber,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      shape: (region.shapeType || 'rectangle') as HighlightShape,
      color: region.color || '#FFD700',
      annotation: region.annotation || undefined,
      tags: region.tags || undefined,
    }));
  }, [highlightVersionData?.regions]);

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
            <ItemHeader
              selectedItem={selectedItem}
              isEditing={isEditing}
              editValues={editValues}
              setEditValues={setEditValues}
              manufacturerOptions={manufacturerOptions}
              isLoadingFactories={isLoadingFactories}
              isEditingItem={isEditingItem}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onDeleteItem={onDeleteItem}
            />

            <ItemDetails
              selectedItem={selectedItem}
              isEditing={isEditing}
              editValues={editValues}
              setEditValues={setEditValues}
            />

            {/* Spec Sheet Section */}
            <div className="border-t border-[var(--border)] pt-6">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">Spec Sheet</h4>

              {selectedItemSpecSheet ? (
                <SpecSheetPreviewPanel
                  specSheet={selectedItemSpecSheet}
                  highlightRegions={highlightRegions}
                  onRemove={async () => {
                    await onRemoveSpecSheet(selectedItem.id);
                  }}
                  onEditHighlights={onEditHighlights}
                />
              ) : (
                <NoSpecSheetPlaceholder
                  onBrowseLibrary={onBrowseLibrary}
                  onUploadNew={onUploadNew}
                />
              )}
            </div>
          </div>
        ) : (
          <EmptyItemState />
        )}
      </div>
    </>
  );
}
