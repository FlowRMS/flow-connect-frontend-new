'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCTS } from '@/app/graphql/warehouse';
import { useCreateInventoryMutation } from '../inventory/api/useInventoryApi'; // Adjust path if needed
import { useWarehouse } from '../WarehouseContext'; // Adjust path if needed

interface CreateInventoryModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateInventoryModal({ onClose, onSuccess }: CreateInventoryModalProps) {
    const { selectedWarehouse } = useWarehouse();
    const [createInventory] = useCreateInventoryMutation();

    // Product Search State
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Queries
    const { data: productsData, loading: loadingProducts } = useQuery<{ productSearch: any[] }>(GET_PRODUCTS, {
        variables: { search: productSearch },
        skip: !showProductDropdown && !productSearch && !selectedProductId
    });

    const products = useMemo(() => productsData?.productSearch || [], [productsData]);

    // Handle outside click for dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectProduct = (product: any) => {
        setSelectedProductId(product.id);
        setProductSearch(product.description || product.factoryPartNumber);
        setShowProductDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWarehouse?.id || !selectedProductId) return;

        try {
            await createInventory({
                variables: {
                    input: {
                        warehouseId: selectedWarehouse.id,
                        productId: selectedProductId,
                    }
                }
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create inventory:", error);
            // Optionally handle error state here
        }
    };

    const selectedProduct = products.find((p: any) => p.id === selectedProductId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-md p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Inventory</h2>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--muted)] rounded transition-colors" title="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            Warehouse
                        </label>
                        <div className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--muted)]/50 text-sm text-[var(--foreground)]">
                            {selectedWarehouse?.name || 'No Warehouse Selected'}
                        </div>
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            Product
                        </label>
                        <input
                            type="text"
                            placeholder="Search product..."
                            value={productSearch}
                            onChange={(e) => {
                                setProductSearch(e.target.value);
                                setShowProductDropdown(true);
                                setSelectedProductId(''); // Reset selection on type
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
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedProductId || !selectedWarehouse?.id}
                            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
