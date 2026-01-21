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
