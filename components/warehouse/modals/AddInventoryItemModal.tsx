'use client';

import React, { useState } from 'react';
import { Inventory, InventoryItemInput } from '@/lib/types/warehouse';
import { mockBins } from '@/lib/data/warehouse-mock';

interface AddInventoryItemModalProps {
  inventory: Inventory;
  onClose: () => void;
  onSave: (item: InventoryItemInput) => void;
}

export default function AddInventoryItemModal({ inventory, onClose, onSave }: AddInventoryItemModalProps) {
  const [formData, setFormData] = useState<InventoryItemInput>({
    inventoryId: inventory.id,
    binId: '',
    quantity: 1,
    weightPerUnit: 0,
    lotNumber: '',
    serialNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    isPerishable: false,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
              <path d="M18 6L6 18M6 6l12 12"/>
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
              Bin Location <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.binId}
              onChange={(e) => handleChange('binId', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              required
            >
              <option value="">Select bin location</option>
              {mockBins.map((bin) => (
                <option key={bin.id} value={bin.id}>
                  Bin {bin.letterCode} (Row {bin.rowId.split('-')[1]})
                </option>
              ))}
            </select>
          </div>

          {/* Weight & Lot Number Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Weight per Unit
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.weightPerUnit}
                onChange={(e) => handleChange('weightPerUnit', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                placeholder="0.00"
              />
            </div>
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
          </div>

          {/* Serial Number & Received Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => handleChange('serialNumber', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                placeholder="Serial number"
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

          {/* Perishable Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Perishable
              </label>
              <p className="text-xs text-[var(--muted-foreground)]">This item has an expiration date</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('isPerishable', !formData.isPerishable)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                formData.isPerishable ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.isPerishable ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Expiration Date (shown if perishable) */}
          {formData.isPerishable && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => handleChange('expirationDate', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
              placeholder="Additional notes..."
            />
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
