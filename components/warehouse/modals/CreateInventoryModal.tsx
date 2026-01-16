'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCTS, GET_WAREHOUSE_LOCATIONS } from '@/app/graphql/warehouse';
import { useCreateInventoryMutation, useAddInventoryItemMutation } from '../inventory/api/useInventoryApi';
import { useWarehouse } from '../WarehouseContext';

interface CreateInventoryModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

interface CreateInventoryData {
    createInventory: {
        id: string;
        productId: string;
        totalQuantity: number;
        availableQuantity: number;
    };
}

export default function CreateInventoryModal({ onClose, onSuccess }: CreateInventoryModalProps) {
    const { selectedWarehouse } = useWarehouse();
    const [createInventory] = useCreateInventoryMutation();
    const [addInventoryItem] = useAddInventoryItemMutation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Product Search State
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Item Fields State
    const [quantity, setQuantity] = useState(1);
    const [locationId, setLocationId] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);

    // Queries
    const { data: productsData, loading: loadingProducts } = useQuery<{ productSearch: any[] }>(GET_PRODUCTS, {
        variables: { search: productSearch },
        skip: !showProductDropdown && !productSearch && !selectedProductId
    });

    const { data: locationsData, loading: loadingLocations } = useQuery<any>(GET_WAREHOUSE_LOCATIONS, {
        variables: { warehouseId: selectedWarehouse?.id },
        skip: !selectedWarehouse?.id
    });

    const products = useMemo(() => productsData?.productSearch || [], [productsData]);
    const locations = useMemo(() => locationsData?.warehouseLocations || [], [locationsData]);

    // Handle outside click for dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectProduct = (product: any) => {
        setSelectedProductId(product.id);
        setProductSearch(product.description || product.factoryPartNumber);
        setShowProductDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWarehouse?.id || !selectedProductId) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Step 1: Create the inventory record
            const result = await createInventory({
                variables: {
                    input: {
                        warehouseId: selectedWarehouse.id,
                        productId: selectedProductId,
                    }
                }
            });

            const inventoryData = result.data as CreateInventoryData | null | undefined;
            const inventoryId = inventoryData?.createInventory?.id;
            if (!inventoryId) {
                throw new Error('Failed to create inventory');
            }

            // Step 2: Add the initial inventory item
            await addInventoryItem({
                variables: {
                    input: {
                        inventoryId,
                        locationId: locationId || null,
                        quantity,
                        lotNumber: lotNumber || null,
                        status: "AVAILABLE",
                        receivedDate: new Date(receivedDate).toISOString(),
                    }
                }
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to create inventory:", err);
            setError(err instanceof Error ? err.message : 'Failed to create inventory');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedProduct = products.find((p: any) => p.id === selectedProductId);
    const isValid = selectedProductId && selectedWarehouse?.id && quantity > 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Add Inventory</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">
                            {selectedWarehouse?.name || 'No Warehouse Selected'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors" title="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Product Search */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            Product <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Search product by name or part number..."
                            value={productSearch}
                            onChange={(e) => {
                                setProductSearch(e.target.value);
                                setShowProductDropdown(true);
                                setSelectedProductId('');
                            }}
                            onFocus={() => setShowProductDropdown(true)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                        {showProductDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {loadingProducts ? (
                                    <div className="p-3 text-xs text-[var(--muted-foreground)]">Loading...</div>
                                ) : products.length > 0 ? (
                                    products.map((product: any) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleSelectProduct(product)}
                                            className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] text-sm flex flex-col"
                                        >
                                            <span className="font-medium text-[var(--foreground)]">{product.description}</span>
                                            <span className="text-xs text-[var(--muted-foreground)]">{product.factoryPartNumber}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-3 text-xs text-[var(--muted-foreground)]">No products found</div>
                                )}
                            </div>
                        )}
                        {selectedProduct && (
                            <div className="mt-2 p-2 bg-[var(--muted)]/50 rounded-lg text-sm">
                                <span className="font-medium">{selectedProduct.description}</span>
                                <span className="text-[var(--muted-foreground)] ml-2">({selectedProduct.factoryPartNumber})</span>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[var(--border)] pt-4">
                        <p className="text-sm font-medium text-[var(--muted-foreground)] mb-3">Initial Stock Details</p>
                    </div>

                    {/* Quantity and Location Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Location
                            </label>
                            <select
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            >
                                <option value="">No location</option>
                                {loadingLocations ? (
                                    <option disabled>Loading...</option>
                                ) : (
                                    locations.map((loc: any) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name} {loc.code ? `(${loc.code})` : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Lot Number and Received Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Lot Number
                            </label>
                            <input
                                type="text"
                                value={lotNumber}
                                onChange={(e) => setLotNumber(e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Received Date
                            </label>
                            <input
                                type="date"
                                value={receivedDate}
                                onChange={(e) => setReceivedDate(e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid || isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {isSubmitting ? 'Creating...' : 'Add Inventory'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
