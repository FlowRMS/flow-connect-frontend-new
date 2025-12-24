'use client';

import React from 'react';
import { FulfillmentOrder } from '@/lib/types/warehouse';

export interface PackingBoxType {
  id: string;
  packagingType: string;
  customWeight: string;
  useCustomWeight: boolean;
  customDimensions: { length: string; width: string; height: string };
  lineItemIds: string[];
}

export const packagingOptions = [
  { value: 'pallet_48x40x6', label: 'Pallet (48x40x6)', dimensions: { length: '48', width: '40', height: '6' } },
  { value: 'small_box', label: 'Small Box', dimensions: { length: '12', width: '10', height: '8' } },
  { value: 'medium_box', label: 'Medium Box', dimensions: { length: '18', width: '14', height: '12' } },
  { value: 'large_box', label: 'Large Box', dimensions: { length: '24', width: '18', height: '18' } },
  { value: 'extra_large_box', label: 'Extra Large Box', dimensions: { length: '30', width: '24', height: '24' } },
  { value: 'custom', label: 'Custom', dimensions: { length: '', width: '', height: '' } },
];

interface PackingBoxProps {
  box: PackingBoxType;
  boxIndex: number;
  fulfillmentOrder: FulfillmentOrder;
  canRemove: boolean;
  draggedItemId: string | null;
  onUpdateBox: (boxId: string, updates: Partial<PackingBoxType>) => void;
  onRemoveBox: (boxId: string) => void;
  onRemoveItemFromBox: (boxId: string, lineItemId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, boxId: string) => void;
  getBoxDimensions: (box: PackingBoxType) => { length: string; width: string; height: string };
  calculateBoxWeight: (box: PackingBoxType) => number;
  getBoxWeight: (box: PackingBoxType) => string;
}

export default function PackingBox({
  box,
  boxIndex,
  fulfillmentOrder,
  canRemove,
  draggedItemId,
  onUpdateBox,
  onRemoveBox,
  onRemoveItemFromBox,
  onDragOver,
  onDrop,
  getBoxDimensions,
  calculateBoxWeight,
  getBoxWeight,
}: PackingBoxProps) {
  const boxDims = getBoxDimensions(box);
  const boxItems = fulfillmentOrder.lineItems.filter(li => box.lineItemIds.includes(li.id));
  const calculatedWeight = calculateBoxWeight(box);
  const displayWeight = getBoxWeight(box);
  const isCustom = box.packagingType === 'custom';

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, box.id)}
      className={`bg-[var(--card)] rounded-lg border-2 overflow-hidden transition-colors ${
        draggedItemId ? 'border-orange-300 border-dashed' : 'border-[var(--border)]'
      }`}
    >
      {/* Box Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
          </svg>
          <span className="font-semibold text-[var(--foreground)]">Pallet {boxIndex + 1}</span>
          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
            {boxItems.length} item{boxItems.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors" title="Print label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
          </button>
          {canRemove && (
            <button
              onClick={() => onRemoveBox(box.id)}
              className="p-1.5 hover:bg-red-100 text-red-500 rounded transition-colors"
              title="Remove pallet"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Box Config */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/10">
        <div className="grid grid-cols-3 gap-3">
          {/* Container Type */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Container</label>
            <select
              value={box.packagingType}
              onChange={(e) => onUpdateBox(box.id, { packagingType: e.target.value })}
              className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              {packagingOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {opt.value !== 'custom' ? `(${opt.dimensions.length}x${opt.dimensions.width}x${opt.dimensions.height})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dimensions */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">
              Dimensions (in)
            </label>
            <div className="flex gap-1 items-center">
              <input
                type="text"
                value={boxDims.length}
                onChange={(e) => onUpdateBox(box.id, { customDimensions: { ...box.customDimensions, length: e.target.value } })}
                disabled={!isCustom}
                placeholder="L"
                className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:bg-[var(--muted)]/50 disabled:text-[var(--muted-foreground)]"
              />
              <span className="text-xs text-[var(--muted-foreground)]">x</span>
              <input
                type="text"
                value={boxDims.width}
                onChange={(e) => onUpdateBox(box.id, { customDimensions: { ...box.customDimensions, width: e.target.value } })}
                disabled={!isCustom}
                placeholder="W"
                className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:bg-[var(--muted)]/50 disabled:text-[var(--muted-foreground)]"
              />
              <span className="text-xs text-[var(--muted-foreground)]">x</span>
              <input
                type="text"
                value={boxDims.height}
                onChange={(e) => onUpdateBox(box.id, { customDimensions: { ...box.customDimensions, height: e.target.value } })}
                disabled={!isCustom}
                placeholder="H"
                className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:bg-[var(--muted)]/50 disabled:text-[var(--muted-foreground)]"
              />
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Weight (lbs)</label>
            <input
              type="text"
              value={box.useCustomWeight ? box.customWeight : calculatedWeight.toFixed(1)}
              onChange={(e) => onUpdateBox(box.id, { customWeight: e.target.value })}
              disabled={!box.useCustomWeight}
              className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:bg-[var(--muted)]/50 disabled:text-[var(--muted-foreground)]"
            />
            <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer mt-1.5">
              <input
                type="checkbox"
                checked={box.useCustomWeight}
                onChange={(e) => onUpdateBox(box.id, { useCustomWeight: e.target.checked })}
                className="rounded border-[var(--border)]"
              />
              Different than calculated
            </label>
          </div>
        </div>
      </div>

      {/* Items in Box */}
      <div className="min-h-[80px]">
        {boxItems.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-50">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            </svg>
            Drop items here
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {boxItems.map((lineItem) => (
              <div
                key={lineItem.id}
                className="px-4 py-2 flex items-center gap-3 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{lineItem.partNumber}</div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate">{lineItem.productName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{lineItem.allocatedQty}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{lineItem.uom}</div>
                </div>
                <button
                  onClick={() => onRemoveItemFromBox(box.id, lineItem.id)}
                  className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors"
                  title="Remove from box"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

