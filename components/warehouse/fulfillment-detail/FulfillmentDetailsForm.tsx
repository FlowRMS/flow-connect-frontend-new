'use client';

import React from 'react';
import { FulfillmentOrder, FulfillmentMethod, shipStatusColors, shipStatusLabels } from '@/lib/types/warehouse';
import { mockWarehouses } from '@/lib/data/warehouse-mock';

interface FulfillmentDetailsFormProps {
  fulfillmentOrder: FulfillmentOrder;
  warehouseId: string;
  fulfillmentMethod: FulfillmentMethod;
  needByDate: string;
  shipToName: string;
  shipToAddressLine1: string;
  shipToAddressLine2: string;
  shipToCity: string;
  shipToState: string;
  shipToPostalCode: string;
  shipToPhone: string;
  carrier: string;
  trackingNumbers: string;
  shipToDifferentFromPO: boolean;
  isReleased: boolean;
  onWarehouseIdChange: (id: string) => void;
  onFulfillmentMethodChange: (method: FulfillmentMethod) => void;
  onNeedByDateChange: (date: string) => void;
  onShipToNameChange: (name: string) => void;
  onShipToAddressLine1Change: (address: string) => void;
  onShipToAddressLine2Change: (address: string) => void;
  onShipToCityChange: (city: string) => void;
  onShipToStateChange: (state: string) => void;
  onShipToPostalCodeChange: (code: string) => void;
  onShipToPhoneChange: (phone: string) => void;
  onCarrierChange: (carrier: string) => void;
  onTrackingNumbersChange: (tracking: string) => void;
  onShipToDifferentFromPOChange: (different: boolean) => void;
}

export default function FulfillmentDetailsForm({
  fulfillmentOrder,
  warehouseId,
  fulfillmentMethod,
  needByDate,
  shipToName,
  shipToAddressLine1,
  shipToAddressLine2,
  shipToCity,
  shipToState,
  shipToPostalCode,
  shipToPhone,
  carrier,
  trackingNumbers,
  shipToDifferentFromPO,
  isReleased,
  onWarehouseIdChange,
  onFulfillmentMethodChange,
  onNeedByDateChange,
  onShipToNameChange,
  onShipToAddressLine1Change,
  onShipToAddressLine2Change,
  onShipToCityChange,
  onShipToStateChange,
  onShipToPostalCodeChange,
  onShipToPhoneChange,
  onCarrierChange,
  onTrackingNumbersChange,
  onShipToDifferentFromPOChange,
}: FulfillmentDetailsFormProps) {
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="col-span-2 space-y-4">
      {/* Warehouse & Method Row */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => onWarehouseIdChange(e.target.value)}
              disabled={isReleased}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mockWarehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Fulfillment Method</label>
            <select
              value={fulfillmentMethod}
              onChange={(e) => onFulfillmentMethodChange(e.target.value as FulfillmentMethod)}
              disabled={isReleased}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="SHIP">Ship</option>
              <option value="WILL_CALL">Will Call</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Need By Date</label>
            <input
              type="date"
              value={needByDate}
              onChange={(e) => onNeedByDateChange(e.target.value)}
              disabled={isReleased}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Ship To - Component Fields */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase">Ship To</label>
          {!isReleased && !shipToDifferentFromPO && (
            <button
              onClick={() => onShipToDifferentFromPOChange(true)}
              className="text-xs text-[var(--primary)] hover:underline font-medium"
            >
              Different than what's on the PO
            </button>
          )}
          {shipToDifferentFromPO && (
            <span className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-medium">Modified from PO</span>
              {!isReleased && (
                <button
                  onClick={() => onShipToDifferentFromPOChange(false)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Reset
                </button>
              )}
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Name</label>
            <input
              type="text"
              value={shipToName}
              onChange={(e) => onShipToNameChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Phone</label>
            <input
              type="text"
              value={shipToPhone}
              onChange={(e) => onShipToPhoneChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address Line 1</label>
            <input
              type="text"
              value={shipToAddressLine1}
              onChange={(e) => onShipToAddressLine1Change(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address Line 2</label>
            <input
              type="text"
              value={shipToAddressLine2}
              onChange={(e) => onShipToAddressLine2Change(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              placeholder="Apt, Suite, etc."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">City</label>
            <input
              type="text"
              value={shipToCity}
              onChange={(e) => onShipToCityChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">State</label>
            <input
              type="text"
              value={shipToState}
              onChange={(e) => onShipToStateChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Postal Code</label>
            <input
              type="text"
              value={shipToPostalCode}
              onChange={(e) => onShipToPostalCodeChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Country</label>
            <input
              type="text"
              value="USA"
              disabled
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30 text-sm opacity-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Shipping Options & Outcome */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Ship Status</label>
            <span className={`inline-flex items-center px-2 py-1.5 rounded text-xs font-medium ${shipStatusColors[fulfillmentOrder.shipStatus]}`}>
              {shipStatusLabels[fulfillmentOrder.shipStatus]}
            </span>
            {fulfillmentOrder.shipConfirmedAt && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{formatDateTime(fulfillmentOrder.shipConfirmedAt)}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Carrier</label>
            <input
              type="text"
              value={carrier}
              onChange={(e) => onCarrierChange(e.target.value)}
              placeholder="e.g., UPS, FedEx"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Tracking #</label>
            <input
              type="text"
              value={trackingNumbers}
              onChange={(e) => onTrackingNumbersChange(e.target.value)}
              placeholder="Enter tracking numbers"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

