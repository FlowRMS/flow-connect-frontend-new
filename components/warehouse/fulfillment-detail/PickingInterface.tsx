'use client';

import React from 'react';
import { FulfillmentOrder } from '@/lib/types/warehouse';

interface PickingInterfaceProps {
  fulfillmentOrder: FulfillmentOrder;
  pickedItems: Record<string, number>;
  pickingNotes: Record<string, string>;
  expandedNoteId: string | null;
  onMarkAsPicked: (lineItemId: string, qty: number) => void;
  onPickAll: (lineItemId: string, allocatedQty: number) => void;
  onSimulateQRScan: (lineItemId: string, allocatedQty: number) => void;
  onUpdateNote: (lineItemId: string, note: string) => void;
  onExpandNote: (lineItemId: string | null) => void;
  onCompletePicking: () => void;
}

export default function PickingInterface({
  fulfillmentOrder,
  pickedItems,
  pickingNotes,
  expandedNoteId,
  onMarkAsPicked,
  onPickAll,
  onSimulateQRScan,
  onUpdateNote,
  onExpandNote,
  onCompletePicking,
}: PickingInterfaceProps) {
  const totalToPick = fulfillmentOrder.lineItems.reduce((sum, li) => sum + li.allocatedQty, 0);
  const totalPicked = Object.values(pickedItems).reduce((sum, qty) => sum + qty, 0);
  const allItemsPicked = fulfillmentOrder.lineItems.every(li => pickedItems[li.id] >= li.allocatedQty);

  return (
    <div className="bg-[var(--card)] rounded-lg border-2 border-yellow-400 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-yellow-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Picking Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {totalPicked} of {totalToPick} items picked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allItemsPicked && (
            <button
              onClick={onCompletePicking}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Complete Picking
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {fulfillmentOrder.lineItems.map((lineItem) => {
          const isPicked = pickedItems[lineItem.id] >= lineItem.allocatedQty;
          const pickedQty = pickedItems[lineItem.id] || 0;
          const hasNote = !!pickingNotes[lineItem.id];
          const isNoteExpanded = expandedNoteId === lineItem.id;

          return (
            <div
              key={lineItem.id}
              className={`transition-colors ${isPicked ? 'bg-green-50' : 'hover:bg-[var(--muted)]/20'}`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Status indicator */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPicked ? 'bg-green-500' : 'bg-[var(--muted)]'
                }`}>
                  {isPicked ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-lg font-bold text-[var(--muted-foreground)]">{lineItem.allocatedQty}</span>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--foreground)]">{lineItem.partNumber}</span>
                    <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">{lineItem.uom}</span>
                    {hasNote && !isNoteExpanded && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Note
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{lineItem.productName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-sm font-medium text-amber-600">{lineItem.pickLocation || 'No location'}</span>
                  </div>
                </div>

                {/* Quantity display */}
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {pickedQty} / {lineItem.allocatedQty}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">picked</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Note button */}
                  <button
                    onClick={() => onExpandNote(isNoteExpanded ? null : lineItem.id)}
                    className={`p-3 border rounded-lg transition-colors ${
                      hasNote
                        ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                    title="Add note"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </button>
                  {!isPicked && (
                    <>
                      <button
                        onClick={() => onSimulateQRScan(lineItem.id, lineItem.allocatedQty)}
                        className="p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                        title="Scan QR to pick"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"/>
                          <rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => onPickAll(lineItem.id, lineItem.allocatedQty)}
                        className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Pick All
                      </button>
                    </>
                  )}
                  {isPicked && (
                    <button
                      onClick={() => onMarkAsPicked(lineItem.id, 0)}
                      className="px-4 py-3 border border-[var(--border)] rounded-lg font-medium text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable note input */}
              {isNoteExpanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className="ml-16 flex gap-2">
                    <input
                      type="text"
                      value={pickingNotes[lineItem.id] || ''}
                      onChange={(e) => onUpdateNote(lineItem.id, e.target.value)}
                      placeholder="Add a note for this item..."
                      className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      autoFocus
                    />
                    <button
                      onClick={() => onExpandNote(null)}
                      className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

