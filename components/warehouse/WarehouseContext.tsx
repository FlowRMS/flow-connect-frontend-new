'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchWarehouses } from './settings/api/warehousesApi';

export type WarehouseViewMode = 'manager' | 'worker';

// Simplified warehouse type for the context
export interface ContextWarehouse {
  id: string;
  name: string;
  status: string;
  isActive?: boolean | null;
  city?: string | null;
  state?: string | null;
  addressLine1?: string | null;
  address?: string | null;
}

interface WarehouseContextType {
  warehouses: ContextWarehouse[];
  selectedWarehouse: ContextWarehouse | null;
  setSelectedWarehouse: (warehouse: ContextWarehouse | null) => void;
  viewMode: WarehouseViewMode;
  setViewMode: (mode: WarehouseViewMode) => void;
  isWorkerView: boolean;
  isManagerView: boolean;
  isLoading: boolean;
}

const VIEW_MODE_STORAGE_KEY = 'warehouse-view-mode';
const SELECTED_WAREHOUSE_KEY = 'selected-warehouse-id';

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

// Helper to get initial view mode from localStorage (runs only on client)
function getInitialViewMode(): WarehouseViewMode {
  if (typeof window === 'undefined') return 'manager';
  const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === 'worker' || stored === 'manager' ? stored : 'manager';
}

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<ContextWarehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouseState] = useState<ContextWarehouse | null>(null);
  const [viewMode, setViewModeState] = useState<WarehouseViewMode>(getInitialViewMode);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch warehouses from API on mount
  useEffect(() => {
    async function loadWarehouses() {
      try {
        const apiWarehouses = await fetchWarehouses();
        const contextWarehouses: ContextWarehouse[] = apiWarehouses.map((w) => ({
          id: w.id,
          name: w.name,
          status: w.status,
          isActive: w.isActive,
          city: w.city,
          state: w.state,
          addressLine1: w.address,
          address: w.address,
        }));
        setWarehouses(contextWarehouses);

        // Try to restore previously selected warehouse from localStorage
        const savedId = localStorage.getItem(SELECTED_WAREHOUSE_KEY);
        const savedWarehouse = savedId
          ? contextWarehouses.find((w) => w.id === savedId)
          : null;

        // Set selected warehouse (saved or first available)
        if (savedWarehouse) {
          setSelectedWarehouseState(savedWarehouse);
        } else if (contextWarehouses.length > 0) {
          setSelectedWarehouseState(contextWarehouses[0]);
        }
      } catch (error) {
        console.error('Failed to fetch warehouses:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWarehouses();
  }, []);

  // Wrapper to persist selected warehouse
  const setSelectedWarehouse = (warehouse: ContextWarehouse | null) => {
    setSelectedWarehouseState(warehouse);
    if (warehouse) {
      localStorage.setItem(SELECTED_WAREHOUSE_KEY, warehouse.id);
    } else {
      localStorage.removeItem(SELECTED_WAREHOUSE_KEY);
    }
  };

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
        isLoading,
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
