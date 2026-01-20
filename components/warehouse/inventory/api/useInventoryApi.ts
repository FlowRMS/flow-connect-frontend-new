'use client';

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_WAREHOUSE_INVENTORY,
  GET_INVENTORY_STATS,
  GET_INVENTORY_STATUSES,
  EXPORT_INVENTORY,
  IMPORT_INVENTORY,
  GET_BACKORDERS,
  CREATE_INVENTORY,
  ADD_INVENTORY_ITEM,
  UPDATE_INVENTORY_ITEM,
  DELETE_INVENTORY_ITEM,
  DELETE_INVENTORY,
  UPDATE_INVENTORY,
} from './inventoryApi';

import { InventoryWithItems } from '../types';

interface InventoryData {
  inventories: InventoryWithItems[];
}

interface InventoryStatsData {
  inventoryStats: {
    totalProducts: number;
    totalQuantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  };
}

interface InventoryStatusesData {
  inventoryStatuses: {
    label: string;
    value: string;
  }[];
}

interface ExportInventoryData {
  exportInventory: string;
}

interface ImportInventoryData {
  importInventory: boolean;
}

interface BackordersData {
  backorders: any[]; // Using any to simplify for now, logic uses it loosely
}

export const useInventoryQuery = (warehouseId?: string) => {
  return useQuery<InventoryData>(GET_WAREHOUSE_INVENTORY, {
    variables: { warehouseId },
    skip: !warehouseId,
  });
};

export const useInventoryStatsQuery = (warehouseId?: string) => {
  return useQuery<InventoryStatsData>(GET_INVENTORY_STATS, {
    variables: { warehouseId },
    skip: !warehouseId,
  });
};

export const useInventoryStatusesQuery = () => {
  return useQuery<InventoryStatusesData>(GET_INVENTORY_STATUSES);
};

export const useExportInventoryMutation = () => {
  return useMutation<ExportInventoryData>(EXPORT_INVENTORY);
};

export const useImportInventoryMutation = () => {
  return useMutation<ImportInventoryData>(IMPORT_INVENTORY);
};

export const useCreateInventoryMutation = () => {
  return useMutation(CREATE_INVENTORY, {
    refetchQueries: [GET_WAREHOUSE_INVENTORY, GET_INVENTORY_STATS],
  });
};

export const useAddInventoryItemMutation = () => {
  return useMutation(ADD_INVENTORY_ITEM, {
    refetchQueries: [GET_WAREHOUSE_INVENTORY, GET_INVENTORY_STATS],
  });
};

export const useUpdateInventoryItemMutation = () => {
  return useMutation(UPDATE_INVENTORY_ITEM, {
    refetchQueries: [GET_WAREHOUSE_INVENTORY, GET_INVENTORY_STATS],
  });
};

export const useDeleteInventoryItemMutation = () => {
  return useMutation(DELETE_INVENTORY_ITEM, {
    refetchQueries: [GET_WAREHOUSE_INVENTORY, GET_INVENTORY_STATS],
  });
};

export const useDeleteInventoryMutation = () => {
  return useMutation(DELETE_INVENTORY, {
    refetchQueries: [GET_WAREHOUSE_INVENTORY, GET_INVENTORY_STATS],
  });
};

export const useUpdateInventoryMutation = () => {
  return useMutation(UPDATE_INVENTORY, {
    refetchQueries: [GET_WAREHOUSE_INVENTORY, GET_INVENTORY_STATS],
  });
};

export const useBackordersQuery = () => {
  return useQuery<BackordersData>(GET_BACKORDERS);
};
