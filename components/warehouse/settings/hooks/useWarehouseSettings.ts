import { useState } from 'react';
import type { Warehouse, WarehouseLocationLevelConfig } from '@/lib/types/warehouse';
import type { WarehouseWithSettings } from '../types';
import { initializeWarehouses, mockAvailableWorkers } from '../mockData';

export function useWarehouseSettings() {
  // State
  const [warehouses, setWarehouses] = useState<WarehouseWithSettings[]>(initializeWarehouses);
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(
    warehouses[0]?.id || null
  );
  const [showNewWarehouseModal, setShowNewWarehouseModal] = useState(false);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState<string | null>(null);
  const [showLayoutModal, setShowLayoutModal] = useState<string | null>(null);
  const [showQRCodesModal, setShowQRCodesModal] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Handlers
  const toggleWarehouseExpansion = (warehouseId: string) => {
    setExpandedWarehouse((prev) => (prev === warehouseId ? null : warehouseId));
  };

  const toggleLevel = (warehouseId: string, level: string) => {
    setWarehouses((prev) =>
      prev.map((wh) =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                locationLevels: wh.settings.locationLevels.map((l) =>
                  l.level === level ? { ...l, enabled: !l.enabled } : l
                ),
              },
            }
          : wh
      )
    );
    setHasChanges(true);
  };

  const updateWorkerRole = (
    warehouseId: string,
    workerId: string,
    newRole: 'worker' | 'manager'
  ) => {
    setWarehouses((prev) =>
      prev.map((wh) =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                workers: wh.settings.workers.map((w) =>
                  w.workerId === workerId ? { ...w, role: newRole } : w
                ),
              },
            }
          : wh
      )
    );
    setHasChanges(true);
  };

  const removeWorker = (warehouseId: string, workerId: string) => {
    setWarehouses((prev) =>
      prev.map((wh) =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                workers: wh.settings.workers.filter((w) => w.workerId !== workerId),
              },
            }
          : wh
      )
    );
    setHasChanges(true);
  };

  const updateWarehouseField = (
    warehouseId: string,
    field: keyof Warehouse,
    value: string | boolean
  ) => {
    setWarehouses((prev) =>
      prev.map((wh) => (wh.id === warehouseId ? { ...wh, [field]: value } : wh))
    );
    setHasChanges(true);
  };

  const addWorker = (warehouseId: string, workerId: string, role: 'worker' | 'manager') => {
    setWarehouses((prev) =>
      prev.map((wh) =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                workers: [...wh.settings.workers, { workerId, role }],
              },
            }
          : wh
      )
    );
    setHasChanges(true);
    setShowAddWorkerModal(null);
  };

  const updateLocationLevels = (
    warehouseId: string,
    levels: WarehouseLocationLevelConfig[]
  ) => {
    setWarehouses((prev) =>
      prev.map((wh) =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                locationLevels: levels,
              },
            }
          : wh
      )
    );
    setHasChanges(true);
  };

  const getWorkerById = (workerId: string) =>
    mockAvailableWorkers.find((w) => w.id === workerId);

  const markChanged = () => setHasChanges(true);

  const resetChanges = () => setHasChanges(false);

  return {
    // State
    warehouses,
    expandedWarehouse,
    showNewWarehouseModal,
    showAddWorkerModal,
    showLayoutModal,
    showQRCodesModal,
    hasChanges,

    // Setters
    setExpandedWarehouse,
    setShowNewWarehouseModal,
    setShowAddWorkerModal,
    setShowLayoutModal,
    setShowQRCodesModal,
    setWarehouses,

    // Handlers
    toggleWarehouseExpansion,
    toggleLevel,
    updateWarehouseField,
    updateLocationLevels,
    addWorker,
    updateWorkerRole,
    removeWorker,
    getWorkerById,
    markChanged,
    resetChanges,
  };
}
