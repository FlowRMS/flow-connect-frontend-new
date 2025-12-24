'use client';

import React from 'react';
import { FulfillmentOrder } from '@/lib/types/warehouse';
import { mockWarehouses } from '@/lib/data/warehouse-mock';
import { PackingBoxType } from './packing/PackingBox';
import ShippingConfigPanel from './shipping/ShippingConfigPanel';

interface ShippingInterfaceProps {
  fulfillmentOrder: FulfillmentOrder;
  packingBoxes: PackingBoxType[];
  shippingMethod: 'SHIP' | 'WILL_CALL';
  carrierType: 'parcel' | 'freight';
  selectedCarrier: string;
  trackingNumbers: string;
  proNumber: string;
  bolNumber: string;
  freightClass: string;
  shippingNotes: string;
  pickupSignature: string | null;
  pickupTimestamp: Date | null;
  pickupName: string;
  driverName: string;
  pickupNotes: string;
  isShippingConfigLocked: boolean;
  isShippingConfigCollapsed: boolean;
  onShippingMethodChange: (method: 'SHIP' | 'WILL_CALL') => void;
  onCarrierTypeChange: (type: 'parcel' | 'freight') => void;
  onCarrierChange: (carrier: string) => void;
  onTrackingNumbersChange: (tracking: string) => void;
  onProNumberChange: (pro: string) => void;
  onBolNumberChange: (bol: string) => void;
  onFreightClassChange: (freightClass: string) => void;
  onShippingNotesChange: (notes: string) => void;
  onToggleLock: () => void;
  onToggleCollapse: () => void;
  onShowPackingSlipModal: () => void;
  onShowShippingLabelsModal: () => void;
  onShowBOLModal: () => void;
  onShowSignatureModal: () => void;
  onClearSignature: () => void;
  onCompleteShipping: () => void;
  getBoxWeight: (box: PackingBoxType) => string;
}

export default function ShippingInterface({
  fulfillmentOrder,
  packingBoxes,
  shippingMethod,
  carrierType,
  selectedCarrier,
  trackingNumbers,
  proNumber,
  bolNumber,
  freightClass,
  shippingNotes,
  pickupSignature,
  pickupTimestamp,
  pickupName,
  driverName,
  pickupNotes,
  isShippingConfigLocked,
  isShippingConfigCollapsed,
  onShippingMethodChange,
  onCarrierTypeChange,
  onCarrierChange,
  onTrackingNumbersChange,
  onProNumberChange,
  onBolNumberChange,
  onFreightClassChange,
  onShippingNotesChange,
  onToggleLock,
  onToggleCollapse,
  onShowPackingSlipModal,
  onShowShippingLabelsModal,
  onShowBOLModal,
  onShowSignatureModal,
  onClearSignature,
  onCompleteShipping,
  getBoxWeight,
}: ShippingInterfaceProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border-2 border-purple-400 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-purple-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Shipping Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Finalize outbound logistics • {packingBoxes.length} pallet{packingBoxes.length > 1 ? 's' : ''} to ship
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Lock & Collapse Buttons */}
          <button
            onClick={onToggleLock}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              isShippingConfigLocked
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
            }`}
          >
            {isShippingConfigLocked ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Unlock
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                </svg>
                Lock
              </>
            )}
          </button>
          <button
            onClick={onToggleCollapse}
            className="px-3 py-1.5 bg-[var(--muted)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)]/80 transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={isShippingConfigCollapsed ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"}/>
            </svg>
            {isShippingConfigCollapsed ? 'Expand' : 'Collapse'}
          </button>
          {selectedCarrier && trackingNumbers && (
            <button
              onClick={onCompleteShipping}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Confirm Shipment
            </button>
          )}
        </div>
      </div>

      {/* Shipping Configuration Panel - Collapsible */}
      <div className="border-b border-[var(--border)]">
        <ShippingConfigPanel
          shippingMethod={shippingMethod}
          carrierType={carrierType}
          selectedCarrier={selectedCarrier}
          trackingNumbers={trackingNumbers}
          proNumber={proNumber}
          bolNumber={bolNumber}
          freightClass={freightClass}
          isLocked={isShippingConfigLocked}
          isCollapsed={isShippingConfigCollapsed}
          onShippingMethodChange={onShippingMethodChange}
          onCarrierTypeChange={onCarrierTypeChange}
          onCarrierChange={onCarrierChange}
          onTrackingNumbersChange={onTrackingNumbersChange}
          onProNumberChange={onProNumberChange}
          onBolNumberChange={onBolNumberChange}
          onFreightClassChange={onFreightClassChange}
        />
      </div>

      {/* Will Call specific info */}
      {shippingMethod === 'WILL_CALL' && (
        <div className="px-4 py-4 border-b border-[var(--border)] bg-blue-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-blue-900">Will Call Pickup</div>
              <div className="text-sm text-blue-700 mt-1">
                Customer will pick up from: <strong>{mockWarehouses.find(w => w.id === fulfillmentOrder.warehouseId)?.name || 'Warehouse'}</strong>
              </div>
              <div className="text-xs text-blue-600 mt-2">
                Make sure all items are staged and ready for pickup. Customer should bring valid ID.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Summary */}
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">Shipment Summary</label>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[var(--muted)]/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{packingBoxes.length}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Pallets</div>
          </div>
          <div className="bg-[var(--muted)]/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {packingBoxes.reduce((sum, box) => sum + parseFloat(getBoxWeight(box) || '0'), 0).toFixed(1)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">Total lbs</div>
          </div>
          <div className="bg-[var(--muted)]/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {fulfillmentOrder.lineItems.reduce((sum, li) => sum + li.allocatedQty, 0)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">Items</div>
          </div>
          <div className="bg-[var(--muted)]/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {fulfillmentOrder.lineItems.length}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">Line Items</div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Conditional based on shipping method and carrier type */}
      <div className="px-4 py-4 bg-[var(--muted)]/10">
        <div className={`grid gap-4 ${
          shippingMethod === 'WILL_CALL'
            ? 'grid-cols-2'
            : (shippingMethod === 'SHIP' && carrierType === 'parcel' ? 'grid-cols-2' : 'grid-cols-3')
        }`}>
          {/* Print Packing Slips - Always shown */}
          <button
            onClick={onShowPackingSlipModal}
            className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
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
              <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} slip{packingBoxes.length > 1 ? 's' : ''} ready</div>
            </div>
          </button>

          {/* SHIP + Parcel: Print Parcel Labels */}
          {shippingMethod === 'SHIP' && carrierType === 'parcel' && (
            <button
              onClick={onShowShippingLabelsModal}
              className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-base font-semibold">Print Parcel Labels</div>
                <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} label{packingBoxes.length > 1 ? 's' : ''} to print</div>
              </div>
            </button>
          )}

          {/* SHIP + Freight/LTL: Print Pallet Labels */}
          {shippingMethod === 'SHIP' && carrierType === 'freight' && (
            <>
              <button
                onClick={onShowShippingLabelsModal}
                className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
              >
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-base font-semibold">Print Pallet Labels</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} label{packingBoxes.length > 1 ? 's' : ''} to print</div>
                </div>
              </button>
              <button
                onClick={onShowBOLModal}
                className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                    <path d="M16 13H8"/>
                    <path d="M16 17H8"/>
                    <path d="M10 9H8"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-base font-semibold">Print Bill of Lading</div>
                  <div className="text-sm text-[var(--muted-foreground)]">BOL document</div>
                </div>
              </button>
            </>
          )}

          {/* WILL_CALL: Print Pallet Labels */}
          {shippingMethod === 'WILL_CALL' && (
            <button
              onClick={onShowShippingLabelsModal}
              className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-base font-semibold">Print Pallet Labels</div>
                <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} label{packingBoxes.length > 1 ? 's' : ''} to print</div>
              </div>
            </button>
          )}
        </div>

        {/* Pickup / Handoff Section - Only for Ship (Freight) or Will Call */}
        {((shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL') && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Pickup / Handoff</h4>
              </div>
              {pickupSignature && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Signed
                </span>
              )}
            </div>

            {pickupSignature ? (
              // Show captured signature info
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs text-green-700 font-medium">Name</label>
                    <p className="text-sm font-semibold text-green-900">{pickupName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-green-700 font-medium">Timestamp</label>
                    <p className="text-sm font-semibold text-green-900">
                      {pickupTimestamp?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-green-700 font-medium">Signature</label>
                  <div className="mt-1 bg-white border border-green-300 rounded p-2">
                    <img src={pickupSignature} alt="Signature" className="h-16 object-contain" />
                  </div>
                </div>
                {pickupNotes && (
                  <div>
                    <label className="text-xs text-green-700 font-medium">Notes</label>
                    <p className="text-sm text-green-800">{pickupNotes}</p>
                  </div>
                )}
                <button
                  onClick={onClearSignature}
                  className="mt-3 text-xs text-green-700 hover:text-green-900 underline"
                >
                  Clear and re-capture
                </button>
              </div>
            ) : (
              // Show button to capture signature
              <button
                onClick={onShowSignatureModal}
                className="w-full px-4 py-6 bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg text-purple-700 font-medium hover:bg-purple-100 hover:border-purple-400 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
                Capture Signature & Release
              </button>
            )}

            {/* Print Proof of Pickup - shown after signature is captured */}
            {pickupSignature && (
              <button
                onClick={onShowBOLModal}
                className="w-full mt-3 px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex items-center justify-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <path d="M9 15l2 2 4-4"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-[var(--foreground)]">Print Proof of Pickup</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Signed BOL document</div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Shipping Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Shipping Notes</label>
          <textarea
            value={shippingNotes}
            onChange={(e) => onShippingNotesChange(e.target.value)}
            placeholder="Add any special shipping instructions or notes..."
            rows={2}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

