/**
 * Inventory API Module
 * GraphQL API for inventory operations
 */

import { crmGraphQLRequest } from '../../lib/graphql/client';

// ============================================================================
// Types
// ============================================================================

export type InventoryItemStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PICKING'
  | 'DAMAGED'
  | 'QUARANTINE';

export type OwnershipType = 'CONSIGNMENT' | 'OWNED' | 'THIRD_PARTY';

export type ABCClass = 'A' | 'B' | 'C';

export interface InventoryItem {
  id: string;
  inventoryId: string;
  locationId: string | null;
  locationName: string | null;
  quantity: number;
  lotNumber: string | null;
  status: InventoryItemStatus;
  receivedDate: string | null;
}

export interface InventoryProduct {
  id: string;
  factoryPartNumber: string;
  description: string;
}

export interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  pickingQuantity: number;
  ownershipType: OwnershipType;
  abcClass: ABCClass | null;
  createdAt: string;
  updatedAt: string;
  items: InventoryItem[];
  product: InventoryProduct;
}

export interface InventoryStats {
  totalProducts: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  pickingQuantity: number;
  lowStockCount: number;
}

// ============================================================================
// GraphQL Fragments
// ============================================================================

const INVENTORY_ITEM_FRAGMENT = `
  id
  inventoryId
  locationId
  locationName
  quantity
  lotNumber
  status
  receivedDate
`;

const INVENTORY_FRAGMENT = `
  id
  productId
  warehouseId
  totalQuantity
  availableQuantity
  reservedQuantity
  pickingQuantity
  ownershipType
  abcClass
  createdAt
  updatedAt
  items {
    ${INVENTORY_ITEM_FRAGMENT}
  }
  product {
    id
    factoryPartNumber
    description
  }
`;

// ============================================================================
// Queries
// ============================================================================

const GET_INVENTORIES = `
  query Inventories(
    $warehouseId: UUID!
    $factoryId: UUID
    $status: String
    $search: String
    $limit: Int
    $offset: Int
  ) {
    inventories(
      warehouseId: $warehouseId
      factoryId: $factoryId
      status: $status
      search: $search
      limit: $limit
      offset: $offset
    ) {
      ${INVENTORY_FRAGMENT}
    }
  }
`;

const GET_INVENTORY_BY_ID = `
  query InventoryById($id: UUID!) {
    inventoryById(id: $id) {
      ${INVENTORY_FRAGMENT}
    }
  }
`;

const GET_INVENTORY_BY_PRODUCT = `
  query InventoryByProduct($productId: UUID!, $warehouseId: UUID!) {
    inventoryByProduct(productId: $productId, warehouseId: $warehouseId) {
      ${INVENTORY_FRAGMENT}
    }
  }
`;

const GET_INVENTORIES_BY_PRODUCTS = `
  query InventoriesByProducts($productIds: [UUID!]!, $warehouseId: UUID!) {
    inventoriesByProducts(productIds: $productIds, warehouseId: $warehouseId) {
      ${INVENTORY_FRAGMENT}
    }
  }
`;

const GET_INVENTORY_STATS = `
  query InventoryStats($warehouseId: UUID!) {
    inventoryStats(warehouseId: $warehouseId) {
      totalProducts
      totalQuantity
      availableQuantity
      reservedQuantity
      pickingQuantity
      lowStockCount
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

export async function fetchInventories(
  warehouseId: string,
  options?: {
    factoryId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Inventory[]> {
  const response = await crmGraphQLRequest<{ inventories: Inventory[] }>({
    query: GET_INVENTORIES,
    variables: {
      warehouseId,
      ...options,
    },
  });

  return response.data?.inventories ?? [];
}

export async function fetchInventoryById(id: string): Promise<Inventory | null> {
  const response = await crmGraphQLRequest<{ inventoryById: Inventory }>({
    query: GET_INVENTORY_BY_ID,
    variables: { id },
  });

  return response.data?.inventoryById ?? null;
}

export async function fetchInventoryByProduct(
  productId: string,
  warehouseId: string
): Promise<Inventory | null> {
  const response = await crmGraphQLRequest<{ inventoryByProduct: Inventory | null }>({
    query: GET_INVENTORY_BY_PRODUCT,
    variables: { productId, warehouseId },
  });

  return response.data?.inventoryByProduct ?? null;
}

export async function fetchInventoriesByProducts(
  productIds: string[],
  warehouseId: string
): Promise<Inventory[]> {
  const response = await crmGraphQLRequest<{ inventoriesByProducts: Inventory[] }>({
    query: GET_INVENTORIES_BY_PRODUCTS,
    variables: { productIds, warehouseId },
  });

  return response.data?.inventoriesByProducts ?? [];
}

export async function fetchInventoryStats(warehouseId: string): Promise<InventoryStats | null> {
  const response = await crmGraphQLRequest<{ inventoryStats: InventoryStats }>({
    query: GET_INVENTORY_STATS,
    variables: { warehouseId },
  });

  return response.data?.inventoryStats ?? null;
}

// ============================================================================
// Picking Helper Functions
// ============================================================================

/**
 * Represents a picking allocation from a specific location
 */
export interface PickingAllocation {
  locationId: string;
  locationName: string;
  locationType: string; // We'll derive this from location hierarchy
  quantity: number;
  inventoryItemId: string;
}

/**
 * Get picking allocations for a product from inventory items
 * This replaces the mock `calculatePickingAllocation` function
 */
export function calculatePickingAllocationFromInventory(
  inventory: Inventory,
  qtyNeeded: number
): PickingAllocation[] {
  const allocations: PickingAllocation[] = [];
  let remaining = qtyNeeded;

  // Sort items by status (AVAILABLE first) and then by quantity (largest first for efficiency)
  const availableItems = inventory.items
    .filter((item) => item.status === 'AVAILABLE' && item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  for (const item of availableItems) {
    if (remaining <= 0) break;

    const pickFromHere = Math.min(item.quantity, remaining);
    if (pickFromHere > 0) {
      allocations.push({
        locationId: item.locationId || 'unassigned',
        locationName: item.locationName || 'Unassigned',
        locationType: 'PRIMARY', // Default - ideally would come from WarehouseLocation
        quantity: pickFromHere,
        inventoryItemId: item.id,
      });
      remaining -= pickFromHere;
    }
  }

  return allocations;
}

/**
 * Get total available quantity for a product from inventory
 */
export function getTotalAvailableFromInventory(inventory: Inventory | null): number {
  if (!inventory) return 0;
  return inventory.availableQuantity;
}
