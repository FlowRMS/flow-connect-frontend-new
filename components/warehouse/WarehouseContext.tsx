'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Warehouse } from '@/lib/types/warehouse';
import { mockWarehouses } from '@/lib/data/warehouse-mock';

interface WarehouseContextType {
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  setSelectedWarehouse: (warehouse: Warehouse | null) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [warehouses] = useState<Warehouse[]>(mockWarehouses);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    mockWarehouses.length > 0 ? mockWarehouses[0] : null
  );

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        selectedWarehouse,
        setSelectedWarehouse,
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
