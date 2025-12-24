import { InventoryItem, Inventory } from '@/lib/types/warehouse';

export type StatFilter = 'all' | 'available' | 'reserved' | 'low_stock';
export type TabType = 'inventory' | 'requests' | 'backorders';

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
