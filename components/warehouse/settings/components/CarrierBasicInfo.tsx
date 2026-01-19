import React from 'react';
import type { ShippingCarrier } from '../types';

interface CarrierBasicInfoProps {
  carrier: ShippingCarrier;
  onUpdate: (updates: Partial<ShippingCarrier>) => void;
}

export default function CarrierBasicInfo({ carrier, onUpdate }: CarrierBasicInfoProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Basic Information
      </h3>
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Carrier Name</label>
            <input
              type="text"
              value={carrier.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">SCAC Code</label>
            <input
              type="text"
              value={carrier.code || ''}
              onChange={(e) => onUpdate({ code: e.target.value })}
              placeholder="e.g., FEDX"
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 font-mono"
            />
          </div>
        </div>
        {/* Carrier Type Selection */}
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Carrier Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdate({ carrierType: 'PARCEL' })}
              className={`p-2 border-2 rounded-lg text-left transition-all ${
                carrier.carrierType === 'PARCEL'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-[var(--border)] hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${
                  carrier.carrierType === 'PARCEL' ? 'bg-blue-500 text-white' : 'bg-[var(--muted)]'
                }`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-xs">Parcel</div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">UPS, FedEx, USPS</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ carrierType: 'FREIGHT' })}
              className={`p-2 border-2 rounded-lg text-left transition-all ${
                carrier.carrierType === 'FREIGHT'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-[var(--border)] hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${
                  carrier.carrierType === 'FREIGHT' ? 'bg-blue-500 text-white' : 'bg-[var(--muted)]'
                }`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="6" width="22" height="12" rx="2"/>
                    <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2"/>
                    <line x1="12" y1="10" x2="12" y2="14"/>
                    <line x1="8" y1="10" x2="8" y2="14"/>
                    <line x1="16" y1="10" x2="16" y2="14"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-xs">Freight / LTL</div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">Pallets, heavy items</div>
                </div>
              </div>
            </button>
          </div>
          {!carrier.carrierType && (
            <p className="text-[10px] text-amber-600 mt-1">
              Select a carrier type to show this carrier in fulfillment dropdowns
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--foreground)]">Active</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={carrier.isActive}
              onChange={(e) => onUpdate({ isActive: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[var(--muted)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
