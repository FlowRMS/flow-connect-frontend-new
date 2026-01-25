import React from 'react';
import type { IncomingShipment } from '@/lib/types/warehouse';
import { shipmentStatusColors, shipmentStatusLabels } from '@/lib/types/warehouse';

interface ReceivingHeaderProps {
  shipment: IncomingShipment;
  onBack: () => void;
  onReleaseToWarehouse: () => void;
  onMarkArrived: () => void;
  onStartReceiving: () => void;
  onCompleteReceiving: () => void;
  isTransitioning: boolean;
  allItemsVerified: boolean;
  formatDate: (dateStr: string) => string;
}

export default function ReceivingHeader({
  shipment,
  onBack,
  onReleaseToWarehouse,
  onMarkArrived,
  onStartReceiving,
  onCompleteReceiving,
  isTransitioning,
  allItemsVerified,
  formatDate,
}: ReceivingHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <button
        onClick={onBack}
        className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{shipment.poNumber}</h1>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${shipmentStatusColors[shipment.status]}`}>
            {shipmentStatusLabels[shipment.status]}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-[var(--muted-foreground)]">From:</span>
          <span className="text-sm font-medium text-[var(--foreground)]">{shipment.vendorName}</span>
          <span className="text-sm text-[var(--muted-foreground)]">|</span>
          <span className="text-sm text-[var(--muted-foreground)]">ETA: {formatDate(shipment.eta)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 border border-[var(--border)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Receipt
        </button>

        {shipment.status === 'DRAFT' && (
          <button
            onClick={onReleaseToWarehouse}
            disabled={isTransitioning}
            className={`px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              isTransitioning ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isTransitioning ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Release to Warehouse
              </>
            )}
          </button>
        )}

        {['PENDING', 'CONFIRMED'].includes(shipment.status) && (
          <button
            onClick={onMarkArrived}
            disabled={isTransitioning}
            className={`px-3 py-1.5 bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              isTransitioning ? 'opacity-60 cursor-not-allowed' : 'hover:bg-purple-700'
            }`}
          >
            {isTransitioning ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                </svg>
                Mark Arrived
              </>
            )}
          </button>
        )}

        {shipment.status === 'ARRIVED' && (
          <button
            onClick={onStartReceiving}
            disabled={isTransitioning}
            className={`px-3 py-1.5 bg-yellow-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              isTransitioning ? 'opacity-60 cursor-not-allowed' : 'hover:bg-yellow-700'
            }`}
          >
            {isTransitioning ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
                Start Receiving
              </>
            )}
          </button>
        )}

        {shipment.status === 'RECEIVING' && allItemsVerified && (
          <button
            onClick={onCompleteReceiving}
            disabled={isTransitioning}
            className={`px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              isTransitioning ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700'
            }`}
          >
            {isTransitioning ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Complete Receiving
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
