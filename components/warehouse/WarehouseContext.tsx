'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Warehouse } from '@/lib/types/warehouse';
import { GET_ALL_WAREHOUSES } from '@/app/graphql/warehouse';

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
  const { data } = useQuery<{ warehouses: any[] }>(GET_ALL_WAREHOUSES);
  const warehouses = useMemo(() => (data?.warehouses || []) as Warehouse[], [data]);

  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Default to first warehouse when data loads
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouse) {
      setSelectedWarehouse(warehouses[0]);
    }
  }, [warehouses, selectedWarehouse]);

  const [viewMode, setViewModeState] = useState<WarehouseViewMode>('manager');

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
