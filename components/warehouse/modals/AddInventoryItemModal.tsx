'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Inventory, InventoryItemInput } from '@/lib/types/warehouse';
import { GET_WAREHOUSE_LOCATIONS } from '@/app/graphql/warehouse';
import { useWarehouse } from '../WarehouseContext';
import { useAddInventoryItemMutation } from '../inventory/api/useInventoryApi';

interface AddInventoryItemModalProps {
  inventory: Inventory;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddInventoryItemModal({ inventory, onClose, onSuccess }: AddInventoryItemModalProps) {
  const { selectedWarehouse } = useWarehouse();
  const [addInventoryItem] = useAddInventoryItemMutation();

  // Fetch real locations
  const { data: locationsData, loading: loadingLocations } = useQuery<any>(GET_WAREHOUSE_LOCATIONS, {
    variables: { warehouseId: selectedWarehouse?.id },
    skip: !selectedWarehouse?.id
  });

  const locations = useMemo(() => locationsData?.warehouseLocations || [], [locationsData]);

  const [formData, setFormData] = useState<InventoryItemInput>({
    inventoryId: inventory.id,
    locationId: '',
    quantity: 1,
    lotNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addInventoryItem({
        variables: {
          input: {
            inventoryId: formData.inventoryId,
            locationId: formData.locationId || null, // Ensure empty string becomes null or valid UUID
            quantity: formData.quantity,
            lotNumber: formData.lotNumber,
            status: "AVAILABLE", // Default status
            receivedDate: new Date(formData.receivedDate as string).toISOString(),
          }
        }
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add inventory item:", error);
    }
  };

  const handleChange = (field: keyof InventoryItemInput, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Add Inventory Item</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              SKU: <span className="font-medium">{inventory.partNumber}</span>
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{inventory.productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              required
            />
          </div>

          {/* Bin Location */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.locationId}
              onChange={(e) => handleChange('locationId', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            // required - optional now if null is allowed, but UI suggests required
            >
              <option value="">Select location</option>
              {loadingLocations ? (
                <option disabled>Loading locations...</option>
              ) : (
                locations.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.code ? `(${loc.code})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Lot Number & Received Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Lot Number
              </label>
              <input
                type="text"
                value={formData.lotNumber}
                onChange={(e) => handleChange('lotNumber', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                placeholder="Lot number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Received Date
              </label>
              <input
                type="date"
                value={formData.receivedDate}
                onChange={(e) => handleChange('receivedDate', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
