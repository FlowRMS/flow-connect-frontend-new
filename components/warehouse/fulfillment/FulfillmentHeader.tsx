'use client';

import React from 'react';
import WarehouseSelector from '../WarehouseSelector';

interface FulfillmentHeaderProps {
  onCreateWave?: () => void;
}

export default function FulfillmentHeader({ onCreateWave }: FulfillmentHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Fulfillment</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Manage order fulfillment and picking
        </p>
      </div>
      <div className="flex items-center gap-3">
        <WarehouseSelector />
      </div>
    </div>
  );
}

