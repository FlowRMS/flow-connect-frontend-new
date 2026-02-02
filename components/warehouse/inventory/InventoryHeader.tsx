import React from 'react';
import WarehouseSelector from '../WarehouseSelector';
import { useWarehouse } from '../WarehouseContext';

import CreateInventoryModal from '../modals/CreateInventoryModal';
import { useState } from 'react';

interface InventoryHeaderProps {
    onRequestClick: () => void;
    onRefresh?: () => void;
}

export default function InventoryHeader({ onRequestClick, onRefresh }: InventoryHeaderProps) {
    const { isManagerView } = useWarehouse();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
                    {/* Manager-only buttons */}
                    {isManagerView && (
                        <>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Create Inventory
                            </button>
                            <button
                                onClick={onRequestClick}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                                Request Inventory
                            </button>
                        </>
                    )}
                </div>
            </div>
            {isCreateModalOpen && (
                <CreateInventoryModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
}
