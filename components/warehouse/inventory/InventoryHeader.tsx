import React from 'react';
import Link from 'next/link';
import WarehouseSelector from '../WarehouseSelector';
import { useWarehouse } from '../WarehouseContext';

export default function InventoryHeader() {
    const { isManagerView } = useWarehouse();
    return (
        <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--foreground)]">Inventory</h1>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Manage consignment inventory and stock levels
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <WarehouseSelector />
                    {/* Export/Import/Request buttons only visible to managers */}
                    {isManagerView && (
                        <>
                            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Export
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Import
                            </button>
                            <Link
                                href="/warehouse/inventory/request/new"
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                                Request Inventory
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
