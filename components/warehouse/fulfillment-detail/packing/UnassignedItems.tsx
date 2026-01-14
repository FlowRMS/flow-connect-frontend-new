'use client';

import React from 'react';
import { FulfillmentOrder } from '../../api/fulfillmentApi';

interface UnassignedItemsProps {
  unassignedItems: FulfillmentOrder['lineItems'];
  draggedItemId: string | null;
  canAddAllToSingleBox: boolean;
  onDragStart: (e: React.DragEvent, lineItemId: string) => void;
  onDragEnd: () => void;
  onAddAllToBox: () => void;
}

export default function UnassignedItems({
  unassignedItems,
  draggedItemId,
  canAddAllToSingleBox,
  onDragStart,
  onDragEnd,
  onAddAllToBox,
}: UnassignedItemsProps) {
  if (unassignedItems.length === 0) return null;

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-amber-50 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Items to Pack ({unassignedItems.length})
          </h4>
          <p className="text-xs text-amber-600 mt-1">Drag items to a pallet below, or click to assign</p>
        </div>
        {canAddAllToSingleBox && (
          <button
            onClick={onAddAllToBox}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            Add All to Pallet
          </button>
        )}
      </div>
      <div className="p-3 flex flex-wrap gap-2">
        {unassignedItems.map((lineItem) => (
          <div
            key={lineItem.id}
            draggable
            onDragStart={(e) => onDragStart(e, lineItem.id)}
            onDragEnd={onDragEnd}
            className={`px-3 py-2 bg-white border border-[var(--border)] rounded-lg cursor-grab active:cursor-grabbing hover:border-orange-400 hover:shadow-sm transition-all flex items-center gap-2 ${
              draggedItemId === lineItem.id ? 'opacity-50' : ''
            }`}
          >
            <span className="w-6 h-6 rounded bg-[var(--muted)] flex items-center justify-center text-xs font-bold">
              {Math.round(Number(lineItem.allocatedQty))}
            </span>
            <div>
              <div className="text-sm font-medium">{lineItem.partNumber}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{lineItem.uom}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] ml-1">
              <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
              <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

