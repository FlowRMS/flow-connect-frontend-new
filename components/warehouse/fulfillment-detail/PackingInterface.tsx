'use client';

import React from 'react';
import { FulfillmentOrder } from '@/lib/types/warehouse';
import PackingBox, { PackingBoxType, packagingOptions } from './packing/PackingBox';
import UnassignedItems from './packing/UnassignedItems';

interface PackingInterfaceProps {
  fulfillmentOrder: FulfillmentOrder;
  packingBoxes: PackingBoxType[];
  draggedItemId: string | null;
  onAddNewBox: () => void;
  onRemoveBox: (boxId: string) => void;
  onUpdateBox: (boxId: string, updates: Partial<PackingBoxType>) => void;
  onDragStart: (e: React.DragEvent, lineItemId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, boxId: string) => void;
  onDragEnd: () => void;
  onAddAllItemsToBox: (boxId: string) => void;
  onRemoveItemFromBox: (boxId: string, lineItemId: string) => void;
  onCompletePacking: () => void;
  onShowPackingSlipModal: () => void;
  getUnassignedItems: () => FulfillmentOrder['lineItems'];
}

export default function PackingInterface({
  fulfillmentOrder,
  packingBoxes,
  draggedItemId,
  onAddNewBox,
  onRemoveBox,
  onUpdateBox,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onAddAllItemsToBox,
  onRemoveItemFromBox,
  onCompletePacking,
  onShowPackingSlipModal,
  getUnassignedItems,
}: PackingInterfaceProps) {
  const unassignedItems = getUnassignedItems();
  const allItemsAssigned = unassignedItems.length === 0;

  const getBoxDimensions = (box: PackingBoxType) => {
    if (box.packagingType === 'custom') {
      return box.customDimensions;
    }
    const packaging = packagingOptions.find(p => p.value === box.packagingType);
    return packaging?.dimensions || { length: '', width: '', height: '' };
  };

  const calculateBoxWeight = (box: PackingBoxType): number => {
    const itemsInBox = fulfillmentOrder.lineItems.filter(li => box.lineItemIds.includes(li.id));
    // Mock: 0.5 lbs per unit
    return itemsInBox.reduce((sum, li) => sum + (li.allocatedQty * 0.5), 0);
  };

  const getBoxWeight = (box: PackingBoxType): string => {
    if (box.useCustomWeight && box.customWeight) {
      return box.customWeight;
    }
    const calculated = calculateBoxWeight(box);
    return calculated > 0 ? calculated.toFixed(1) : '0.0';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[var(--card)] rounded-lg border-2 border-orange-400 overflow-hidden">
        <div className="px-4 py-3 bg-orange-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Packing Mode</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Drag items into pallets • {packingBoxes.length} pallet{packingBoxes.length > 1 ? 's' : ''} • {unassignedItems.length} items to assign
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddNewBox}
              className="px-3 py-2 border border-orange-400 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Pallet
            </button>
            {allItemsAssigned && (
              <button
                onClick={onCompletePacking}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Complete Packing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unassigned Items */}
      <UnassignedItems
        unassignedItems={unassignedItems}
        draggedItemId={draggedItemId}
        canAddAllToSingleBox={packingBoxes.length === 1}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onAddAllToBox={() => onAddAllItemsToBox(packingBoxes[0].id)}
      />

      {/* Boxes Grid */}
      <div className="grid grid-cols-2 gap-4">
        {packingBoxes.map((box, boxIndex) => (
          <PackingBox
            key={box.id}
            box={box}
            boxIndex={boxIndex}
            fulfillmentOrder={fulfillmentOrder}
            canRemove={packingBoxes.length > 1}
            draggedItemId={draggedItemId}
            onUpdateBox={onUpdateBox}
            onRemoveBox={onRemoveBox}
            onRemoveItemFromBox={onRemoveItemFromBox}
            onDragOver={onDragOver}
            onDrop={onDrop}
            getBoxDimensions={getBoxDimensions}
            calculateBoxWeight={calculateBoxWeight}
            getBoxWeight={getBoxWeight}
          />
        ))}
      </div>

      {/* Print Actions - Packing Screen */}
      <div className="mt-4">
        <button
          onClick={onShowPackingSlipModal}
          className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-[var(--primary)] hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-base font-semibold">Print Packing Slips</div>
            <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} pallet{packingBoxes.length > 1 ? 's' : ''} ready</div>
          </div>
        </button>
      </div>
    </div>
  );
}

