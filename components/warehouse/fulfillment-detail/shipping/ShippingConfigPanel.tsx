'use client';

import React from 'react';

interface ShippingConfigPanelProps {
  shippingMethod: 'SHIP' | 'WILL_CALL';
  carrierType: 'parcel' | 'freight';
  selectedCarrier: string;
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
  trackingNumbers,
  proNumber,
  bolNumber,
  freightClass,
  isLocked,
  isCollapsed,
  onShippingMethodChange,
  onCarrierTypeChange,
  onCarrierChange,
  onTrackingNumbersChange,
  onProNumberChange,
  onBolNumberChange,
  onFreightClassChange,
}: ShippingConfigPanelProps) {
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
                  <span className="text-sm text-[var(--muted-foreground)] capitalize">{selectedCarrier.replace('_', ' ')}</span>
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
      {/* Delivery Method Selection */}
      <div className={`px-4 py-4 bg-[var(--muted)]/10 ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">Delivery Method</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onShippingMethodChange('SHIP')}
            disabled={isLocked}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              shippingMethod === 'SHIP'
                ? 'border-purple-500 bg-purple-50'
                : 'border-[var(--border)] hover:border-purple-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                shippingMethod === 'SHIP' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
              }`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold">Ship</div>
                <div className="text-xs text-[var(--muted-foreground)]">Carrier delivery</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => onShippingMethodChange('WILL_CALL')}
            disabled={isLocked}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              shippingMethod === 'WILL_CALL'
                ? 'border-purple-500 bg-purple-50'
                : 'border-[var(--border)] hover:border-purple-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                shippingMethod === 'WILL_CALL' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
              }`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold">Will Call</div>
                <div className="text-xs text-[var(--muted-foreground)]">Customer pickup</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Carrier Type Selection - only show if Ship method */}
      {shippingMethod === 'SHIP' && (
        <div className={`px-4 py-4 border-t border-[var(--border)] ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-3">Carrier Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onCarrierTypeChange('parcel')}
              disabled={isLocked}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                carrierType === 'parcel'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-[var(--border)] hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  carrierType === 'parcel' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
                }`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Parcel</div>
                  <div className="text-xs text-[var(--muted-foreground)]">UPS, FedEx, USPS, DHL</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => onCarrierTypeChange('freight')}
              disabled={isLocked}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                carrierType === 'freight'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-[var(--border)] hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  carrierType === 'freight' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
                }`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="6" width="22" height="12" rx="2"/>
                    <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2"/>
                    <line x1="12" y1="10" x2="12" y2="14"/>
                    <line x1="8" y1="10" x2="8" y2="14"/>
                    <line x1="16" y1="10" x2="16" y2="14"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Freight / LTL</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Pallets, heavy shipments</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Carrier Selection & Tracking */}
      {shippingMethod === 'SHIP' && (
        <div className={`px-4 py-4 border-t border-[var(--border)] ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-2 gap-4">
            {/* Carrier Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                {carrierType === 'parcel' ? 'Parcel Carrier' : 'Freight Carrier'}
              </label>
              <select
                value={selectedCarrier}
                onChange={(e) => onCarrierChange(e.target.value)}
                disabled={isLocked}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
              >
                <option value="">Select carrier...</option>
                {carrierType === 'parcel' ? (
                  <>
                    <option value="ups">UPS</option>
                    <option value="fedex">FedEx</option>
                    <option value="usps">USPS</option>
                    <option value="dhl">DHL</option>
                    <option value="other_parcel">Other</option>
                  </>
                ) : (
                  <>
                    <option value="estes">Estes Express</option>
                    <option value="xpo">XPO Logistics</option>
                    <option value="saia">SAIA</option>
                    <option value="old_dominion">Old Dominion</option>
                    <option value="yrc">YRC Freight</option>
                    <option value="abf">ABF Freight</option>
                    <option value="r+l">R+L Carriers</option>
                    <option value="other_freight">Other</option>
                  </>
                )}
              </select>
            </div>

            {/* Tracking Number */}
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
          </div>

          {/* Freight-specific fields */}
          {carrierType === 'freight' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
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
            </div>
          )}
        </div>
      )}
    </>
  );
}

