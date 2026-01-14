import React from 'react';
import type { LineItemReceive } from '../types';

interface PutAwayInterfaceProps {
  lineItems: LineItemReceive[];
  warehouseBins: Array<{ id: string; letterCode?: string; currentQuantity?: number; maxCapacity?: number }>;
  onPutAway: (lineItemId: string) => void;
}

export default function PutAwayInterface({
  lineItems,
  warehouseBins,
  onPutAway,
}: PutAwayInterfaceProps) {
  const pendingPutAway = lineItems.filter((lineItem) => lineItem.verified && !lineItem.putAway);

  return (
    <div className="bg-[var(--card)] rounded-lg border-2 border-blue-400 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-blue-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Put-Away Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Scan bins to put away verified items
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {pendingPutAway.map((lineItem) => (
            <div
              key={lineItem.id}
              className="p-4 bg-[var(--muted)]/20 border border-[var(--border)] rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{lineItem.partNumber}</span>
                <span className="text-lg font-bold">{lineItem.receivedQty} units</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">{lineItem.productName}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600">
                  Target: Bin {warehouseBins.find((bin) => bin.id === lineItem.binId)?.letterCode || '-'}
                </span>
                <button
                  onClick={() => onPutAway(lineItem.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm Put-Away
                </button>
              </div>
            </div>
          ))}
        </div>

        {pendingPutAway.length === 0 && (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p>All verified items have been put away</p>
          </div>
        )}
      </div>
    </div>
  );
}
