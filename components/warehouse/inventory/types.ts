import { InventoryItem, Inventory, InventoryStatus } from '@/lib/types/warehouse';

export type StatFilter = 'all' | 'available' | 'reserved' | 'low_stock';
export type TabType = 'inventory' | 'requests' | 'backorders';

// Sorting types for inventory table
export type InventorySortField = 'factoryName' | 'productName' | 'partNumber' | 'binLocation' | 'status' | 'quantity' | 'receivedDate';
export type SortDirection = 'asc' | 'desc';

// Column filter types for inventory table
export interface InventoryColumnFilters {
  factoryName: string[];
  productName: string;
  partNumber: string;
  location: string;
  status: string[];
  dateRange: { start: string; end: string };
}

export interface FlatInventoryItem extends InventoryItem {
  productName: string;
  partNumber: string;
  factoryName: string;
  factoryId: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  inTransitQuantity: number;
  reorderPoint?: number;
}

export interface BackorderItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  backorderQty: number;
  orderNumber: string;
  customerName: string;
  loggedAt?: string;
}
