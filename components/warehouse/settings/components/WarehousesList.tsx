import React from 'react';
import type { Warehouse } from '@/lib/types/warehouse';
import type { WarehouseWithSettings, WarehouseWorker } from '../types';
import WarehouseAccordionItem from './WarehouseAccordionItem';

interface WarehousesListProps {
  warehouses: WarehouseWithSettings[];
  expandedWarehouse: string | null;
  toggleWarehouseExpansion: (warehouseId: string) => void;
  updateWarehouseField: (warehouseId: string, field: keyof Warehouse, value: string) => void;
  toggleLevel: (warehouseId: string, level: string) => void;
  updateWorkerRole: (warehouseId: string, workerId: string, role: 'worker' | 'manager') => void;
  removeWorker: (warehouseId: string, workerId: string) => void;
  setShowAddWorkerModal: (warehouseId: string | null) => void;
  setShowLayoutModal: (warehouseId: string | null) => void;
  setShowQRCodesModal: (warehouseId: string | null) => void;
  getWorkerById: (workerId: string) => WarehouseWorker | undefined;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
  isLoadingDetails?: boolean;
}

export default function WarehousesList({
  warehouses,
  expandedWarehouse,
  toggleWarehouseExpansion,
  updateWarehouseField,
  toggleLevel,
  updateWorkerRole,
  removeWorker,
  setShowAddWorkerModal,
  setShowLayoutModal,
  setShowQRCodesModal,
  getWorkerById,
  hasChanges,
  isSaving,
  onSave,
  isLoadingDetails = false,
}: WarehousesListProps) {
  if (warehouses.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-[var(--muted-foreground)] opacity-50 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <p className="text-[var(--muted-foreground)] text-lg mb-2">No warehouses configured</p>
        <p className="text-sm text-[var(--muted-foreground)]">Add a warehouse to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {warehouses.map((warehouse) => {
        const isExpanded = expandedWarehouse === warehouse.id;

        return (
          <WarehouseAccordionItem
            key={warehouse.id}
            warehouse={warehouse}
            isExpanded={isExpanded}
            onToggleExpansion={() => toggleWarehouseExpansion(warehouse.id)}
            onUpdateField={(field, value) => updateWarehouseField(warehouse.id, field, value)}
            onToggleLevel={(level) => toggleLevel(warehouse.id, level)}
            onUpdateWorkerRole={(workerId, role) =>
              updateWorkerRole(warehouse.id, workerId, role)
            }
            onRemoveWorker={(workerId) => removeWorker(warehouse.id, workerId)}
            onShowAddWorker={() => setShowAddWorkerModal(warehouse.id)}
            onShowLayout={() => setShowLayoutModal(warehouse.id)}
            onShowQRCodes={() => setShowQRCodesModal(warehouse.id)}
            getWorkerById={getWorkerById}
            hasChanges={hasChanges}
            isSaving={isSaving}
            onSave={onSave}
            isLoadingDetails={isExpanded && isLoadingDetails}
          />
        );
      })}
    </div>
  );
}
