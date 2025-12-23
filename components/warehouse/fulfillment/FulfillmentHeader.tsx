'use client';

import React from 'react';
import WarehouseSelector from '../WarehouseSelector';

interface FulfillmentHeaderProps {
  onCreateWave: () => void;
}

export default function FulfillmentHeader({ onCreateWave }: FulfillmentHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Fulfillment</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Manage order fulfillment and picking waves
        </p>
      </div>
      <div className="flex items-center gap-3">
        <WarehouseSelector />
        <button
          onClick={onCreateWave}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
          Create Wave
        </button>
      </div>
    </div>
  );
}

