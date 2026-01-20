'use client';

import React from 'react';
import { useShippingCarriersByType } from '@/components/warehouse/settings/api/useShippingCarriersApi';

interface ShippingConfigPanelProps {
  shippingMethod: 'SHIP' | 'WILL_CALL';
  carrierType: 'parcel' | 'freight';
  selectedCarrier: string;
  carrierName?: string;
  trackingNumbers: string;
  proNumber: string;
  bolNumber: string;
  freightClass: string;
  isLocked: boolean;
  isCollapsed: boolean;
  onShippingMethodChange: (method: 'SHIP' | 'WILL_CALL') => void;
  onCarrierTypeChange: (type: 'parcel' | 'freight') => void;
  onCarrierChange: (carrier: string) => void;
  onTrackingNumbersChange: (tracking: string) => void;
  onProNumberChange: (pro: string) => void;
  onBolNumberChange: (bol: string) => void;
  onFreightClassChange: (freightClass: string) => void;
}

export default function ShippingConfigPanel({
  shippingMethod,
  carrierType,
  selectedCarrier,
  carrierName,
  trackingNumbers,
  proNumber,
  bolNumber,
  freightClass,
  isLocked,
  isCollapsed,
  onTrackingNumbersChange,
  onProNumberChange,
  onBolNumberChange,
  onFreightClassChange,
}: ShippingConfigPanelProps) {
  // Fetch carriers to look up names
  const carrierTypeForQuery = carrierType === 'parcel' ? 'PARCEL' : 'FREIGHT';
  const { data: carriers = [] } = useShippingCarriersByType(carrierTypeForQuery, true);

  // Check if string is a UUID
  const isUUID = (str: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  // Format carrier name for display
  const formatCarrier = (carrier: string) => {
    // If carrierName is provided directly (from fulfillment order), use it
    if (carrierName) {
      return carrierName;
    }
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

  if (isCollapsed) {
    return (
      <div className="px-4 py-3 bg-[var(--muted)]/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
              {shippingMethod === 'SHIP' ? (
                <>
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </>
              ) : (
                <>
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </>
              )}
            </svg>
            <span className="font-medium text-sm">{shippingMethod === 'SHIP' ? 'Ship' : 'Will Call'}</span>
          </div>
          {shippingMethod === 'SHIP' && (
            <>
              <span className="text-[var(--muted-foreground)]">•</span>
              <span className="text-sm text-[var(--muted-foreground)]">
                {carrierType === 'parcel' ? 'Parcel' : 'Freight/LTL'}
              </span>
              {selectedCarrier && (
                <>
                  <span className="text-[var(--muted-foreground)]">•</span>
                  <span className="text-sm text-[var(--muted-foreground)]">{formatCarrier(selectedCarrier)}</span>
                </>
              )}
            </>
          )}
          {isLocked && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Locked
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Pre-configured Shipping Configuration - Read-only display */}
      <div className="px-4 py-4 bg-[var(--muted)]/10 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[var(--foreground)]">Shipping Configuration</label>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Set in Pending
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Delivery Method - Read Only */}
          <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  {shippingMethod === 'SHIP' ? (
                    <>
                      <rect x="1" y="3" width="15" height="13"/>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </>
                  ) : (
                    <>
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </>
                  )}
                </svg>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Method</p>
                <p className="text-sm font-medium">{shippingMethod === 'SHIP' ? 'Ship' : 'Will Call'}</p>
              </div>
            </div>
          </div>

          {/* Carrier Type - Read Only */}
          {shippingMethod === 'SHIP' && (
            <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    {carrierType === 'parcel' ? (
                      <>
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </>
                    ) : (
                      <>
                        <rect x="1" y="6" width="22" height="12" rx="2"/>
                        <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2"/>
                        <line x1="12" y1="10" x2="12" y2="14"/>
                      </>
                    )}
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Type</p>
                  <p className="text-sm font-medium">{carrierType === 'parcel' ? 'Parcel' : 'Freight/LTL'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Carrier - Read Only */}
          {shippingMethod === 'SHIP' && (
            <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    <rect x="1" y="3" width="15" height="13"/>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/>
                    <circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Carrier</p>
                  <p className="text-sm font-medium">{selectedCarrier ? formatCarrier(selectedCarrier) : 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracking & Shipping Details - Editable */}
      {shippingMethod === 'SHIP' && (
        <div className={`px-4 py-4 ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
            Shipping Details
            {!isLocked && <span className="text-xs text-[var(--muted-foreground)] ml-2 font-normal">(Enter before completing shipment)</span>}
          </label>

          <div className="grid grid-cols-2 gap-4">
            {/* Tracking Number / PRO Number */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                {carrierType === 'parcel' ? 'Tracking Number(s)' : 'PRO Number'}
              </label>
              <input
                type="text"
                value={carrierType === 'parcel' ? trackingNumbers : proNumber}
                onChange={(e) => carrierType === 'parcel' ? onTrackingNumbersChange(e.target.value) : onProNumberChange(e.target.value)}
                placeholder={carrierType === 'parcel' ? 'Enter tracking number(s)' : 'Enter PRO number'}
                disabled={isLocked}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
              />
            </div>

            {/* BOL Number for freight */}
            {carrierType === 'freight' && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">BOL Number</label>
                <input
                  type="text"
                  value={bolNumber}
                  onChange={(e) => onBolNumberChange(e.target.value)}
                  placeholder="Bill of Lading number"
                  disabled={isLocked}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                />
              </div>
            )}

            {/* Freight Class for freight */}
            {carrierType === 'freight' && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Freight Class</label>
                <select
                  value={freightClass}
                  onChange={(e) => onFreightClassChange(e.target.value)}
                  disabled={isLocked}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                >
                  <option value="">Select class...</option>
                  <option value="50">Class 50</option>
                  <option value="55">Class 55</option>
                  <option value="60">Class 60</option>
                  <option value="65">Class 65</option>
                  <option value="70">Class 70</option>
                  <option value="77.5">Class 77.5</option>
                  <option value="85">Class 85</option>
                  <option value="92.5">Class 92.5</option>
                  <option value="100">Class 100</option>
                  <option value="110">Class 110</option>
                  <option value="125">Class 125</option>
                  <option value="150">Class 150</option>
                  <option value="175">Class 175</option>
                  <option value="200">Class 200</option>
                  <option value="250">Class 250</option>
                  <option value="300">Class 300</option>
                  <option value="400">Class 400</option>
                  <option value="500">Class 500</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Will Call - no additional fields needed, just showing the pickup info */}
      {shippingMethod === 'WILL_CALL' && (
        <div className="px-4 py-4 text-center text-sm text-[var(--muted-foreground)]">
          <p>Customer will pick up order at the warehouse.</p>
          <p className="mt-1">Signature will be captured upon pickup.</p>
        </div>
      )}
    </>
  );
}
