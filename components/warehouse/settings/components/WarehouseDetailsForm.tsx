import React from 'react';
import type { Warehouse } from '@/lib/types/warehouse';
import type { WarehouseWithSettings } from '../types';

interface WarehouseDetailsFormProps {
  warehouse: WarehouseWithSettings;
  onUpdateField: (field: keyof Warehouse, value: string) => void;
}

export default function WarehouseDetailsForm({
  warehouse,
  onUpdateField,
}: WarehouseDetailsFormProps) {
  return (
    <div className="mb-6 pb-4 border-b border-[var(--border)]">
      <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Warehouse Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Name</label>
          <input
            type="text"
            value={warehouse.name}
            onChange={(e) => onUpdateField('name', e.target.value)}
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address</label>
          <input
            type="text"
            value={warehouse.addressLine1}
            onChange={(e) => onUpdateField('addressLine1', e.target.value)}
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">City</label>
            <input
              type="text"
              value={warehouse.city}
              onChange={(e) => onUpdateField('city', e.target.value)}
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">State</label>
            <input
              type="text"
              value={warehouse.state}
              onChange={(e) => onUpdateField('state', e.target.value)}
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">ZIP</label>
            <input
              type="text"
              value={warehouse.postalCode}
              onChange={(e) => onUpdateField('postalCode', e.target.value)}
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
