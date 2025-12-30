'use client';

import React from 'react';
import { IncomingShipment, shipmentStatusColors, shipmentStatusLabels, ShipmentStatus } from '@/lib/types/warehouse';

interface ShipmentDetailModalProps {
  shipment: IncomingShipment;
  onClose: () => void;
  onReceive?: () => void;
  onUpdateStatus?: (status: ShipmentStatus) => void;
}

export default function ShipmentDetailModal({ shipment, onClose, onReceive, onUpdateStatus }: ShipmentDetailModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalExpected = shipment.items.reduce((sum, item) => sum + item.expectedQuantity, 0);
  const totalReceived = shipment.items.reduce((sum, item) => sum + item.receivedQuantity, 0);

  const canReceive = shipment.status === 'ARRIVED' || shipment.status === 'RECEIVING';
  const canUpdateToArrived = shipment.status === 'IN_TRANSIT';
  const canUpdateToInTransit = shipment.status === 'CONFIRMED' || shipment.status === 'PENDING';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{shipment.poNumber}</h2>
              <span className={`px-2 py-1 rounded text-xs font-medium ${shipmentStatusColors[shipment.status]}`}>
                {shipmentStatusLabels[shipment.status]}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              From {shipment.vendorName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--muted)]/30 rounded-lg p-4">
              <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Expected Arrival</div>
              <div className="text-lg font-semibold text-[var(--foreground)] mt-1">{formatShortDate(shipment.eta)}</div>
            </div>
            <div className="bg-[var(--muted)]/30 rounded-lg p-4">
              <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Total Items</div>
              <div className="text-lg font-semibold text-[var(--foreground)] mt-1">{shipment.itemCount} products</div>
            </div>
            <div className="bg-[var(--muted)]/30 rounded-lg p-4">
              <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Total Quantity</div>
              <div className="text-lg font-semibold text-[var(--foreground)] mt-1">
                {totalReceived > 0 ? `${totalReceived}/${totalExpected}` : totalExpected} units
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="bg-[var(--muted)]/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Delivery Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted-foreground)]">Vendor:</span>
                <span className="ml-2 text-[var(--foreground)]">{shipment.vendorName}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Warehouse:</span>
                <span className="ml-2 text-[var(--foreground)]">{shipment.warehouseName}</span>
              </div>
              {shipment.carrier && (
                <div>
                  <span className="text-[var(--muted-foreground)]">Carrier:</span>
                  <span className="ml-2 text-[var(--foreground)]">{shipment.carrier}</span>
                </div>
              )}
              {shipment.trackingNumber && (
                <div>
                  <span className="text-[var(--muted-foreground)]">Tracking:</span>
                  <span className="ml-2 text-[var(--foreground)] font-mono">{shipment.trackingNumber}</span>
                </div>
              )}
              {shipment.vendorContact && (
                <div>
                  <span className="text-[var(--muted-foreground)]">Contact:</span>
                  <span className="ml-2 text-[var(--foreground)]">{shipment.vendorContact}</span>
                </div>
              )}
              {shipment.vendorEmail && (
                <div>
                  <span className="text-[var(--muted-foreground)]">Email:</span>
                  <span className="ml-2 text-[var(--foreground)]">{shipment.vendorEmail}</span>
                </div>
              )}
              <div>
                <span className="text-[var(--muted-foreground)]">Created:</span>
                <span className="ml-2 text-[var(--foreground)]">{formatDate(shipment.createdAt)}</span>
              </div>
              {shipment.receivedAt && (
                <div>
                  <span className="text-[var(--muted-foreground)]">Received:</span>
                  <span className="ml-2 text-[var(--foreground)]">{formatDate(shipment.receivedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Expected Items</h3>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part Number</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Expected</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {shipment.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{item.partNumber}</td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">{item.expectedQuantity}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={item.receivedQuantity > 0 ? 'text-green-600' : 'text-[var(--muted-foreground)]'}>
                          {item.receivedQuantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--muted)]/30">
                    <td colSpan={2} className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">Total</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)] text-right">{totalExpected}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      <span className={totalReceived > 0 ? 'text-green-600' : 'text-[var(--muted-foreground)]'}>
                        {totalReceived}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {shipment.notes && (
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Notes</h3>
              <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/20 rounded-lg p-3">
                {shipment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {canUpdateToInTransit && onUpdateStatus && (
              <button
                onClick={() => onUpdateStatus('IN_TRANSIT')}
                className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
              >
                Mark In Transit
              </button>
            )}
            {canUpdateToArrived && onUpdateStatus && (
              <button
                onClick={() => onUpdateStatus('ARRIVED')}
                className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
              >
                Mark Arrived
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Close
            </button>
            {canReceive && onReceive && (
              <button
                onClick={onReceive}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Start Receiving
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
