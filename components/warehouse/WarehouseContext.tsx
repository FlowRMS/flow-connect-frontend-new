'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Warehouse } from '@/lib/types/warehouse';
import { fetchWarehouses } from './api/warehouseDeliveriesApi';

export type WarehouseViewMode = 'manager' | 'worker';

interface WarehouseContextType {
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  setSelectedWarehouse: (warehouse: Warehouse | null) => void;
  viewMode: WarehouseViewMode;
  setViewMode: (mode: WarehouseViewMode) => void;
  isWorkerView: boolean;
  isManagerView: boolean;
}

const VIEW_MODE_STORAGE_KEY = 'warehouse-view-mode';

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [viewMode, setViewModeState] = useState<WarehouseViewMode>('manager');

  useEffect(() => {
    let isMounted = true;

    const loadWarehouses = async () => {
      try {
        const data = await fetchWarehouses();
        if (!isMounted) return;

        const mapped = data.map((warehouse) => ({
          id: warehouse.id,
          name: warehouse.name,
          addressLine1: warehouse.addressLine1 || '',
          addressLine2: undefined,
          city: warehouse.city || '',
          state: warehouse.state || '',
          postalCode: '',
          country: '',
          description: undefined,
          isActive: warehouse.isActive ?? warehouse.status === 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        setWarehouses(mapped);
        setSelectedWarehouse((current) => (current || mapped[0] || null));
      } catch (error) {
        console.error('Failed to load warehouses', error);
      }
    };

    void loadWarehouses();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load view mode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === 'worker' || stored === 'manager') {
      setViewModeState(stored);
    }
  }, []);

  // Persist view mode to localStorage and notify other components
  const setViewMode = (mode: WarehouseViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    // Dispatch custom event for same-tab updates (sidebar listens to this)
    window.dispatchEvent(new Event('warehouse-view-mode-change'));
  };

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        selectedWarehouse,
        setSelectedWarehouse,
        viewMode,
        setViewMode,
        isWorkerView: viewMode === 'worker',
        isManagerView: viewMode === 'manager',
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
}
