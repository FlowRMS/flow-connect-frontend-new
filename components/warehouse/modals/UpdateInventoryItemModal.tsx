'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { useUpdateInventoryItemMutation } from '../inventory/api/useInventoryApi';
import { GET_WAREHOUSE_LOCATIONS } from '@/app/graphql/warehouse';
import { useWarehouse } from '../WarehouseContext';
import { FlatInventoryItem } from '../inventory/types';
import { InventoryStatus, inventoryStatusLabels } from '@/lib/types/warehouse';

interface UpdateInventoryItemModalProps {
    item: FlatInventoryItem;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function UpdateInventoryItemModal({ item, onClose, onSuccess }: UpdateInventoryItemModalProps) {
    const { selectedWarehouse } = useWarehouse();
    const [updateInventoryItem] = useUpdateInventoryItemMutation();

    // Fetch real locations
    const { data: locationsData, loading: loadingLocations } = useQuery<any>(GET_WAREHOUSE_LOCATIONS, {
        variables: { warehouseId: selectedWarehouse?.id },
        skip: !selectedWarehouse?.id
    });

    const locations = useMemo(() => locationsData?.warehouseLocations || [], [locationsData]);

    const [formData, setFormData] = useState({
        quantity: item.quantity,
        locationId: item.locationId || '',
        status: item.status as InventoryStatus,
        lotNumber: item.lotNumber || '',
        receivedDate: item.receivedDate ? new Date(item.receivedDate).toISOString().split('T')[0] : '',
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateInventoryItem({
                variables: {
                    input: {
                        id: item.id,
                        quantity: formData.quantity,
                        locationId: formData.locationId || null, // Ensure empty string becomes null or valid UUID
                        status: formData.status,
                        lotNumber: formData.lotNumber,
                        receivedDate: formData.receivedDate ? new Date(formData.receivedDate).toISOString() : null,
                    }
                }
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update inventory item:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit Inventory Item</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">
                            {item.productName} - {item.partNumber}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={formData.quantity}
                                onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                                onFocus={(e) => e.target.select()}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            >
                                {Object.entries(inventoryStatusLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            Location
                        </label>
                        <select
                            value={formData.locationId}
                            onChange={(e) => handleChange('locationId', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        >
                            <option value="">No Location</option>
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
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
