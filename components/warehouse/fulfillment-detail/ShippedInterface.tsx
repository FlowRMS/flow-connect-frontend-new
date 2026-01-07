'use client';

import React from 'react';
import { FulfillmentOrder } from '@/lib/types/warehouse';
import { PackingBoxType } from './packing/PackingBox';
import { useShippingCarriersByType } from '@/components/warehouse/settings/api/useShippingCarriersApi';

interface ShippedInterfaceProps {
  fulfillmentOrder: FulfillmentOrder;
  packingBoxes: PackingBoxType[];
  shippingMethod: 'SHIP' | 'WILL_CALL';
  shippedData: {
    carrierType: 'parcel' | 'freight';
    carrier: string;
    trackingNumbers: string;
    shipConfirmedAt?: string;
    pickupSignature?: string | null;
    pickupTimestamp?: Date | null;
    pickupCustomerName?: string;
    pickupDriverName?: string;
    pickupNotes?: string;
    shippingNotes?: string;
    bolNumber?: string;
    proNumber?: string;
  };
  onShowPackingSlipModal: () => void;
  onShowShippingLabelsModal: () => void;
  onShowBOLModal: () => void;
}

export default function ShippedInterface({
  fulfillmentOrder,
  packingBoxes,
  shippingMethod,
  shippedData,
  onShowPackingSlipModal,
  onShowShippingLabelsModal,
  onShowBOLModal,
}: ShippedInterfaceProps) {
  // Fetch carriers to look up names
  const carrierTypeForQuery = shippedData.carrierType === 'parcel' ? 'PARCEL' : 'FREIGHT';
  const { data: carriers = [] } = useShippingCarriersByType(carrierTypeForQuery, true);

  // Check if string is a UUID
  const isUUID = (str: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  // Format carrier name for display
  const formatCarrier = (carrier: string | undefined | null) => {
    if (!carrier) return 'N/A';
    // If it's a UUID, look up the carrier name
    if (isUUID(carrier)) {
      const foundCarrier = carriers.find(c => c.id === carrier);
      if (foundCarrier) {
        return foundCarrier.name + (foundCarrier.code ? ` (${foundCarrier.code})` : '');
      }
      return 'Carrier Selected';
    }
    return carrier.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border-2 border-green-400 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-green-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Shipment Complete</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Order fulfilled on {shippedData.shipConfirmedAt ? new Date(shippedData.shipConfirmedAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
          Shipped
        </span>
      </div>

      {/* Shipment Summary */}
      <div className="p-4 space-y-4">
        {/* Delivery Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--muted)]/20 rounded-lg p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Delivery Method</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {shippingMethod === 'SHIP' ? (shippedData.carrierType === 'parcel' ? 'Ship (Parcel)' : 'Ship (Freight)') : 'Will Call'}
            </div>
          </div>
          <div className="bg-[var(--muted)]/20 rounded-lg p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Carrier</div>
            <div className="text-sm font-semibold text-[var(--foreground)] capitalize">
              {formatCarrier(shippedData.carrier)}
            </div>
          </div>
          <div className="bg-[var(--muted)]/20 rounded-lg p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Pallets</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {packingBoxes.length || 1} pallet{packingBoxes.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="bg-[var(--muted)]/20 rounded-lg p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Ship Date</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {shippedData.shipConfirmedAt ? new Date(shippedData.shipConfirmedAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Tracking Information */}
        {shippedData.trackingNumbers && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-sm font-semibold text-blue-900">Tracking Information</span>
            </div>
            <div className="text-sm text-blue-800 font-mono">{shippedData.trackingNumbers}</div>
          </div>
        )}

        {/* BOL / PRO Numbers for Freight */}
        {(shippedData.bolNumber || shippedData.proNumber) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-sm font-semibold text-amber-900">Freight Documents</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {shippedData.bolNumber && (
                <div>
                  <div className="text-xs font-medium text-amber-700 uppercase">BOL Number</div>
                  <div className="text-sm text-amber-900 font-mono">{shippedData.bolNumber}</div>
                </div>
              )}
              {shippedData.proNumber && (
                <div>
                  <div className="text-xs font-medium text-amber-700 uppercase">PRO Number</div>
                  <div className="text-sm text-amber-900 font-mono">{shippedData.proNumber}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pickup / Handoff Record - Only shown if signature was captured */}
        {shippedData.pickupSignature && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
              <span className="text-sm font-semibold text-purple-900">Pickup / Handoff Record</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {shippedData.pickupCustomerName && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-purple-700 uppercase">Customer Name</div>
                    <div className="text-sm text-purple-900">{shippedData.pickupCustomerName}</div>
                  </div>
                )}
                {shippedData.pickupDriverName && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-purple-700 uppercase">Driver / Pickup Name</div>
                    <div className="text-sm text-purple-900">{shippedData.pickupDriverName}</div>
                  </div>
                )}
                {shippedData.pickupTimestamp && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-purple-700 uppercase">Pickup Time</div>
                    <div className="text-sm text-purple-900">{shippedData.pickupTimestamp.toLocaleString()}</div>
                  </div>
                )}
                {shippedData.pickupNotes && (
                  <div>
                    <div className="text-xs font-medium text-purple-700 uppercase">Notes</div>
                    <div className="text-sm text-purple-900">{shippedData.pickupNotes}</div>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-medium text-purple-700 uppercase mb-1">Signature</div>
                <div className="bg-white border border-purple-200 rounded-lg p-2 inline-block">
                  <img src={shippedData.pickupSignature || ''} alt="Signature" className="max-h-20" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline / Activity Log */}
        <div className="border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-sm font-semibold text-[var(--foreground)]">Fulfillment Timeline</span>
          </div>
          <div className="space-y-3">
            {shippedData.shipConfirmedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Shipment Confirmed</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{new Date(shippedData.shipConfirmedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
            {shippedData.pickupTimestamp && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Signature Captured</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{shippedData.pickupTimestamp.toLocaleString()}</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"/>
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Shipping Started</div>
                <div className="text-xs text-[var(--muted-foreground)]">Carrier: {formatCarrier(shippedData.carrier)}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"/>
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Packing Completed</div>
                <div className="text-xs text-[var(--muted-foreground)]">{packingBoxes.length} pallet{packingBoxes.length !== 1 ? 's' : ''} packed</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"/>
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Picking Completed</div>
                <div className="text-xs text-[var(--muted-foreground)]">All items picked</div>
              </div>
            </div>
            {fulfillmentOrder.releasedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Released to Warehouse</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{new Date(fulfillmentOrder.releasedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
            {fulfillmentOrder.createdAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Order Created</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{new Date(fulfillmentOrder.createdAt).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reprint Documents */}
        <div className="border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
              <path d="M6 9V2h12v7"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span className="text-sm font-semibold text-[var(--foreground)]">Reprint Documents</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={onShowPackingSlipModal}
              className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex flex-col items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-[var(--foreground)]">Packing Slip</span>
            </button>
            <button
              onClick={onShowShippingLabelsModal}
              className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex flex-col items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-[var(--foreground)]">Pallet Labels</span>
            </button>
            {((shippingMethod === 'SHIP' && shippedData.carrierType === 'freight') || shippingMethod === 'WILL_CALL') && (
              <button
                onClick={onShowBOLModal}
                className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-[var(--foreground)]">Bill of Lading</span>
              </button>
            )}
            {shippedData.pickupSignature && (
              <button
                onClick={onShowBOLModal}
                className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <path d="M9 15l2 2 4-4"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-[var(--foreground)]">Proof of Pickup</span>
              </button>
            )}
          </div>
        </div>

        {/* Shipping Notes */}
        {shippedData.shippingNotes && (
          <div className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span className="text-sm font-semibold text-[var(--foreground)]">Shipping Notes</span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{shippedData.shippingNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

