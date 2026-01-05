/**
 * Warehouse Locations API Module
 * GraphQL API for warehouse location CRUD operations
 */

import { crmGraphQLRequest } from '../../../lib/graphql/client';

// ============================================================================
// Types
// ============================================================================

/** Location level codes (matches backend WarehouseStructureCode) */
export type LocationLevel = 'SECTION' | 'AISLE' | 'SHELF' | 'BAY' | 'ROW' | 'BIN';

/** Numeric level codes for internal use */
export const LEVEL_TO_NUMBER: Record<LocationLevel, number> = {
  SECTION: 1,
  AISLE: 2,
  SHELF: 3,
  BAY: 4,
  ROW: 5,
  BIN: 6,
};

/** Number to level string mapping */
export const NUMBER_TO_LEVEL: Record<number, LocationLevel> = {
  1: 'SECTION',
  2: 'AISLE',
  3: 'SHELF',
  4: 'BAY',
  5: 'ROW',
  6: 'BIN',
};

export interface LocationProductAssignment {
  id: string;
  locationId: string;
  productId: string;
  quantity: number;
  createdAt: string;
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  parentId: string | null;
  level: LocationLevel;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  rotation: number | null;
  createdAt: string;
  children?: WarehouseLocation[];
  productAssignments?: LocationProductAssignment[];
}

export interface CreateWarehouseLocationInput {
  warehouseId: string;
  parentId?: string | null;
  level: LocationLevel;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  rotation?: number | null;
}

export interface UpdateWarehouseLocationInput extends CreateWarehouseLocationInput {}

export interface BulkWarehouseLocationInput {
  id?: string | null; // Existing location ID (null for new locations)
  parentId?: string | null; // Real UUID parent (for existing parents)
  tempId?: string; // Temp ID for new locations (e.g., "SECTION-123")
  tempParentId?: string; // Temp parent ID (when parent is also new)
  level: LocationLevel;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  rotation?: number | null;
}

// ============================================================================
// GraphQL Fragments
// ============================================================================

const LOCATION_FIELDS = `
  id
  warehouseId
  parentId
  level
  name
  code
  description
  isActive
  sortOrder
  x
  y
  width
  height
  rotation
  createdAt
`;

const PRODUCT_ASSIGNMENT_FIELDS = `
  id
  locationId
  productId
  quantity
  createdAt
`;

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_WAREHOUSE_LOCATIONS = `
  query GetWarehouseLocations($warehouseId: UUID!) {
    warehouseLocations(warehouseId: $warehouseId) {
      ${LOCATION_FIELDS}
    }
  }
`;

const GET_WAREHOUSE_LOCATION_TREE = `
  query GetWarehouseLocationTree($warehouseId: UUID!) {
    warehouseLocationTree(warehouseId: $warehouseId) {
      ${LOCATION_FIELDS}
      children {
        ${LOCATION_FIELDS}
        children {
          ${LOCATION_FIELDS}
          children {
            ${LOCATION_FIELDS}
            children {
              ${LOCATION_FIELDS}
              children {
                ${LOCATION_FIELDS}
                productAssignments {
                  ${PRODUCT_ASSIGNMENT_FIELDS}
                }
              }
              productAssignments {
                ${PRODUCT_ASSIGNMENT_FIELDS}
              }
            }
            productAssignments {
              ${PRODUCT_ASSIGNMENT_FIELDS}
            }
          }
          productAssignments {
            ${PRODUCT_ASSIGNMENT_FIELDS}
          }
        }
        productAssignments {
          ${PRODUCT_ASSIGNMENT_FIELDS}
        }
      }
      productAssignments {
        ${PRODUCT_ASSIGNMENT_FIELDS}
      }
    }
  }
`;

const GET_WAREHOUSE_LOCATION = `
  query GetWarehouseLocation($id: UUID!) {
    warehouseLocation(id: $id) {
      ${LOCATION_FIELDS}
      children {
        ${LOCATION_FIELDS}
      }
      productAssignments {
        ${PRODUCT_ASSIGNMENT_FIELDS}
      }
    }
  }
`;

const GET_LOCATION_PRODUCT_ASSIGNMENTS = `
  query GetLocationProductAssignments($locationId: UUID!) {
    locationProductAssignments(locationId: $locationId) {
      ${PRODUCT_ASSIGNMENT_FIELDS}
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_WAREHOUSE_LOCATION = `
  mutation CreateWarehouseLocation($input: WarehouseLocationInput!) {
    createWarehouseLocation(input: $input) {
      ${LOCATION_FIELDS}
    }
  }
`;

const UPDATE_WAREHOUSE_LOCATION = `
  mutation UpdateWarehouseLocation($id: UUID!, $input: WarehouseLocationInput!) {
    updateWarehouseLocation(id: $id, input: $input) {
      ${LOCATION_FIELDS}
    }
  }
`;

const DELETE_WAREHOUSE_LOCATION = `
  mutation DeleteWarehouseLocation($id: UUID!) {
    deleteWarehouseLocation(id: $id)
  }
`;

const BULK_SAVE_WAREHOUSE_LOCATIONS = `
  mutation BulkSaveWarehouseLocations($warehouseId: UUID!, $locations: [BulkWarehouseLocationInput!]!) {
    bulkSaveWarehouseLocations(warehouseId: $warehouseId, locations: $locations) {
      ${LOCATION_FIELDS}
    }
  }
`;

const ASSIGN_PRODUCT_TO_LOCATION = `
  mutation AssignProductToLocation($locationId: UUID!, $productId: UUID!, $quantity: Int!) {
    assignProductToLocation(locationId: $locationId, productId: $productId, quantity: $quantity) {
      ${PRODUCT_ASSIGNMENT_FIELDS}
    }
  }
`;

const UPDATE_PRODUCT_QUANTITY_AT_LOCATION = `
  mutation UpdateProductQuantityAtLocation($locationId: UUID!, $productId: UUID!, $quantity: Int!) {
    updateProductQuantityAtLocation(locationId: $locationId, productId: $productId, quantity: $quantity) {
      ${PRODUCT_ASSIGNMENT_FIELDS}
    }
  }
`;

const REMOVE_PRODUCT_FROM_LOCATION = `
  mutation RemoveProductFromLocation($locationId: UUID!, $productId: UUID!) {
    removeProductFromLocation(locationId: $locationId, productId: $productId)
  }
`;

// ============================================================================
// API Functions - Queries
// ============================================================================

/**
 * Fetch all locations for a warehouse (flat list)
 */
export async function fetchWarehouseLocations(warehouseId: string): Promise<WarehouseLocation[]> {
  const response = await crmGraphQLRequest<{ warehouseLocations: WarehouseLocation[] }>({
    query: GET_WAREHOUSE_LOCATIONS,
    variables: { warehouseId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch warehouse locations');
  }

  return response.data?.warehouseLocations || [];
}

/**
 * Fetch location tree for a warehouse (hierarchical with nested children)
 */
export async function fetchWarehouseLocationTree(warehouseId: string): Promise<WarehouseLocation[]> {
  const response = await crmGraphQLRequest<{ warehouseLocationTree: WarehouseLocation[] }>({
    query: GET_WAREHOUSE_LOCATION_TREE,
    variables: { warehouseId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch warehouse location tree');
  }

  return response.data?.warehouseLocationTree || [];
}

/**
 * Fetch a single location by ID
 */
export async function fetchWarehouseLocation(id: string): Promise<WarehouseLocation | null> {
  const response = await crmGraphQLRequest<{ warehouseLocation: WarehouseLocation }>({
    query: GET_WAREHOUSE_LOCATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch warehouse location');
  }

  return response.data?.warehouseLocation || null;
}

/**
 * Fetch product assignments for a location
 */
export async function fetchLocationProductAssignments(
  locationId: string
): Promise<LocationProductAssignment[]> {
  const response = await crmGraphQLRequest<{
    locationProductAssignments: LocationProductAssignment[];
  }>({
    query: GET_LOCATION_PRODUCT_ASSIGNMENTS,
    variables: { locationId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch location product assignments');
  }

  return response.data?.locationProductAssignments || [];
}

// ============================================================================
// API Functions - Mutations
// ============================================================================

/**
 * Create a new location
 */
export async function createWarehouseLocation(
  input: CreateWarehouseLocationInput
): Promise<WarehouseLocation> {
  const response = await crmGraphQLRequest<{ createWarehouseLocation: WarehouseLocation }>({
    query: CREATE_WAREHOUSE_LOCATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create warehouse location');
  }

  if (!response.data?.createWarehouseLocation) {
    throw new Error('No location returned from create mutation');
  }

  return response.data.createWarehouseLocation;
}

/**
 * Update an existing location
 */
export async function updateWarehouseLocation(
  id: string,
  input: UpdateWarehouseLocationInput
): Promise<WarehouseLocation> {
  const response = await crmGraphQLRequest<{ updateWarehouseLocation: WarehouseLocation }>({
    query: UPDATE_WAREHOUSE_LOCATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update warehouse location');
  }

  if (!response.data?.updateWarehouseLocation) {
    throw new Error('No location returned from update mutation');
  }

  return response.data.updateWarehouseLocation;
}

/**
 * Delete a location (cascade deletes children)
 */
export async function deleteWarehouseLocation(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteWarehouseLocation: boolean }>({
    query: DELETE_WAREHOUSE_LOCATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete warehouse location');
  }

  return true;
}

/**
 * Bulk save locations for a warehouse
 * Creates new locations, updates existing ones, and deletes removed ones
 */
export async function bulkSaveWarehouseLocations(
  warehouseId: string,
  locations: BulkWarehouseLocationInput[]
): Promise<WarehouseLocation[]> {
  const response = await crmGraphQLRequest<{ bulkSaveWarehouseLocations: WarehouseLocation[] }>({
    query: BULK_SAVE_WAREHOUSE_LOCATIONS,
    variables: { warehouseId, locations },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to bulk save warehouse locations');
  }

  return response.data?.bulkSaveWarehouseLocations || [];
}

/**
 * Assign a product to a location
 */
export async function assignProductToLocation(
  locationId: string,
  productId: string,
  quantity: number
): Promise<LocationProductAssignment> {
  const response = await crmGraphQLRequest<{ assignProductToLocation: LocationProductAssignment }>({
    query: ASSIGN_PRODUCT_TO_LOCATION,
    variables: { locationId, productId, quantity },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to assign product to location');
  }

  if (!response.data?.assignProductToLocation) {
    throw new Error('No assignment returned from assign mutation');
  }

  return response.data.assignProductToLocation;
}

/**
 * Update product quantity at a location
 */
export async function updateProductQuantityAtLocation(
  locationId: string,
  productId: string,
  quantity: number
): Promise<LocationProductAssignment> {
  const response = await crmGraphQLRequest<{
    updateProductQuantityAtLocation: LocationProductAssignment;
  }>({
    query: UPDATE_PRODUCT_QUANTITY_AT_LOCATION,
    variables: { locationId, productId, quantity },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product quantity');
  }

  if (!response.data?.updateProductQuantityAtLocation) {
    throw new Error('No assignment returned from update mutation');
  }

  return response.data.updateProductQuantityAtLocation;
}

/**
 * Remove a product from a location
 */
export async function removeProductFromLocation(
  locationId: string,
  productId: string
): Promise<boolean> {
  const response = await crmGraphQLRequest<{ removeProductFromLocation: boolean }>({
    query: REMOVE_PRODUCT_FROM_LOCATION,
    variables: { locationId, productId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to remove product from location');
  }

  return true;
}
