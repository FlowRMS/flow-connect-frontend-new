/**
 * Warehouses API Module
 * GraphQL API for warehouse CRUD operations
 */

import { crmGraphQLRequest } from "../../../lib/graphql/client";

// ============================================================================
// Types
// ============================================================================

export interface WarehouseStructure {
  id: string;
  warehouseId: string;
  code: number | string; // Backend may return number (1-6) or enum string (SECTION, AISLE, etc.)
  levelOrder: number;
}

export interface WarehouseSettings {
  id: string;
  warehouseId: string;
  autoGenerateCodes: boolean;
  requireLocation: boolean;
  showInPickLists: boolean;
  generateQrCodes: boolean;
}

export interface WarehouseMember {
  id: string;
  warehouseId: string;
  userId: string;
  role: number | "WORKER" | "MANAGER"; // Backend may return number (1=WORKER, 2=MANAGER) or string enum
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  status: string;
  latitude?: string | null;
  longitude?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  postalCode?: string | null;
  createdAt: string;
  members?: WarehouseMember[];
  settings?: WarehouseSettings | null;
  structure?: WarehouseStructure[];
}

export interface CreateWarehouseInput {
  name: string;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  isActive?: boolean;
}

export type UpdateWarehouseInput = CreateWarehouseInput;

export interface WarehouseSettingsInput {
  warehouseId: string;
  autoGenerateCodes?: boolean;
  requireLocation?: boolean;
  showInPickLists?: boolean;
  generateQrCodes?: boolean;
}

export interface WarehouseStructureLevelInput {
  code: number; // 1=SECTION, 2=AISLE, 3=SHELF, 4=BAY, 5=ROW, 6=BIN
  levelOrder: number;
}

// Address types
export type AddressSourceType = "CUSTOMER" | "FACTORY" | "SHIPPING_CARRIER";
export type AddressType = "BILLING" | "SHIPPING" | "MAILING" | "OTHER";

export interface WarehouseAddress {
  id: string;
  sourceId: string;
  sourceType: AddressSourceType;
  addressType: AddressType;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  zipCode?: string | null;
  country: string;
  notes?: string | null;
  isPrimary: boolean;
  createdAt: string;
}

// Helper to normalize API response - converts addressTypes array to addressType
function normalizeWarehouseAddress(
  address: WarehouseAddress & { addressTypes?: AddressType[] },
): WarehouseAddress {
  return {
    ...address,
    addressType: address.addressTypes?.[0] || address.addressType || "OTHER",
  };
}

export interface AddressInput {
  sourceId: string;
  sourceType: AddressSourceType;
  addressTypes?: AddressType[];
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  zipCode?: string | null;
  country: string;
  notes?: string | null;
  isPrimary?: boolean;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_WAREHOUSES = `
  query GetWarehouses {
    warehouses {
      id
      name
      status
      latitude
      longitude
      description
      isActive
      createdAt
      members {
        id
        warehouseId
        userId
        role
        createdAt
      }
      settings {
        id
        warehouseId
        autoGenerateCodes
        requireLocation
        showInPickLists
        generateQrCodes
      }
      structure {
        id
        warehouseId
        code
        levelOrder
      }
    }
  }
`;

const GET_WAREHOUSE = `
  query GetWarehouse($id: UUID!) {
    warehouse(id: $id) {
      id
      name
      status
      latitude
      longitude
      description
      isActive
      createdAt
      members {
        id
        warehouseId
        userId
        role
        createdAt
      }
      settings {
        id
        warehouseId
        autoGenerateCodes
        requireLocation
        showInPickLists
        generateQrCodes
      }
      structure {
        id
        warehouseId
        code
        levelOrder
      }
    }
  }
`;

const CREATE_WAREHOUSE = `
  mutation CreateWarehouse($input: WarehouseInput!) {
    createWarehouse(input: $input) {
      id
      name
      status
      latitude
      longitude
      description
      isActive
      createdAt
    }
  }
`;

const UPDATE_WAREHOUSE = `
  mutation UpdateWarehouse($id: UUID!, $input: WarehouseInput!) {
    updateWarehouse(id: $id, input: $input) {
      id
      name
      status
      latitude
      longitude
      description
      isActive
      createdAt
    }
  }
`;

const DELETE_WAREHOUSE = `
  mutation DeleteWarehouse($id: UUID!) {
    deleteWarehouse(id: $id)
  }
`;

const ASSIGN_WORKER = `
  mutation AssignWorkerToWarehouse($warehouseId: UUID!, $userId: UUID!, $role: Int!) {
    assignWorkerToWarehouse(warehouseId: $warehouseId, userId: $userId, role: $role) {
      id
      warehouseId
      userId
      role
      createdAt
    }
  }
`;

const UPDATE_WORKER_ROLE = `
  mutation UpdateWorkerRole($warehouseId: UUID!, $userId: UUID!, $role: Int!) {
    updateWorkerRole(warehouseId: $warehouseId, userId: $userId, role: $role) {
      id
      warehouseId
      userId
      role
      createdAt
    }
  }
`;

const REMOVE_WORKER = `
  mutation RemoveWorkerFromWarehouse($warehouseId: UUID!, $userId: UUID!) {
    removeWorkerFromWarehouse(warehouseId: $warehouseId, userId: $userId)
  }
`;

const UPDATE_WAREHOUSE_SETTINGS = `
  mutation UpdateWarehouseSettings($input: WarehouseSettingsInput!) {
    updateWarehouseSettings(input: $input) {
      id
      warehouseId
      autoGenerateCodes
      requireLocation
      showInPickLists
      generateQrCodes
    }
  }
`;

const UPDATE_WAREHOUSE_STRUCTURE = `
  mutation UpdateWarehouseStructure($warehouseId: UUID!, $levels: [WarehouseStructureLevelInput!]!) {
    updateWarehouseStructure(warehouseId: $warehouseId, levels: $levels) {
      id
      warehouseId
      code
      levelOrder
    }
  }
`;

// Address queries and mutations
const GET_ADDRESSES_BY_SOURCE = `
  query GetAddressesBySource($sourceType: AddressSourceTypeEnum!, $sourceId: UUID!) {
    addressesBySource(sourceType: $sourceType, sourceId: $sourceId) {
      id
      sourceId
      sourceType
      addressTypes
      line1
      line2
      city
      state
      zipCode
      country
      notes
      isPrimary
      createdAt
    }
  }
`;

const CREATE_ADDRESS = `
  mutation CreateAddress($input: AddressInput!) {
    createAddress(input: $input) {
      id
      sourceId
      sourceType
      addressTypes
      line1
      line2
      city
      state
      zipCode
      country
      notes
      isPrimary
      createdAt
    }
  }
`;

const UPDATE_ADDRESS = `
  mutation UpdateAddress($id: UUID!, $input: AddressInput!) {
    updateAddress(id: $id, input: $input) {
      id
      sourceId
      sourceType
      addressTypes
      line1
      line2
      city
      state
      zipCode
      country
      notes
      isPrimary
      createdAt
    }
  }
`;

const DELETE_ADDRESS = `
  mutation DeleteAddress($id: UUID!) {
    deleteAddress(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all warehouses
 */
export async function fetchWarehouses(): Promise<Warehouse[]> {
  const response = await crmGraphQLRequest<{ warehouses: Warehouse[] }>({
    query: GET_WAREHOUSES,
  });

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to fetch warehouses",
    );
  }

  return response.data?.warehouses || [];
}

/**
 * Fetch a single warehouse by ID
 */
export async function fetchWarehouseById(
  id: string,
): Promise<Warehouse | null> {
  const response = await crmGraphQLRequest<{ warehouse: Warehouse }>({
    query: GET_WAREHOUSE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || "Failed to fetch warehouse");
  }

  return response.data?.warehouse || null;
}

/**
 * Create a new warehouse
 */
export async function createWarehouse(
  input: CreateWarehouseInput,
): Promise<Warehouse> {
  const response = await crmGraphQLRequest<{ createWarehouse: Warehouse }>({
    query: CREATE_WAREHOUSE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to create warehouse",
    );
  }

  if (!response.data?.createWarehouse) {
    throw new Error("No warehouse returned from create mutation");
  }

  return response.data.createWarehouse;
}

/**
 * Update an existing warehouse
 */
export async function updateWarehouse(
  id: string,
  input: UpdateWarehouseInput,
): Promise<Warehouse> {
  const response = await crmGraphQLRequest<{ updateWarehouse: Warehouse }>({
    query: UPDATE_WAREHOUSE,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to update warehouse",
    );
  }

  if (!response.data?.updateWarehouse) {
    throw new Error("No warehouse returned from update mutation");
  }

  return response.data.updateWarehouse;
}

/**
 * Delete a warehouse
 */
export async function deleteWarehouse(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteWarehouse: boolean }>({
    query: DELETE_WAREHOUSE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to delete warehouse",
    );
  }

  return true;
}

/**
 * Assign a worker to a warehouse
 */
export async function assignWorkerToWarehouse(
  warehouseId: string,
  userId: string,
  role: number,
): Promise<WarehouseMember> {
  const response = await crmGraphQLRequest<{
    assignWorkerToWarehouse: WarehouseMember;
  }>({
    query: ASSIGN_WORKER,
    variables: { warehouseId, userId, role },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || "Failed to assign worker");
  }

  if (!response.data?.assignWorkerToWarehouse) {
    throw new Error("No member returned from assign mutation");
  }

  return response.data.assignWorkerToWarehouse;
}

/**
 * Update a worker's role
 */
export async function updateWorkerRole(
  warehouseId: string,
  userId: string,
  role: number,
): Promise<WarehouseMember> {
  const response = await crmGraphQLRequest<{
    updateWorkerRole: WarehouseMember;
  }>({
    query: UPDATE_WORKER_ROLE,
    variables: { warehouseId, userId, role },
  });

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to update worker role",
    );
  }

  if (!response.data?.updateWorkerRole) {
    throw new Error("No member returned from update role mutation");
  }

  return response.data.updateWorkerRole;
}

/**
 * Remove a worker from a warehouse
 */
export async function removeWorkerFromWarehouse(
  warehouseId: string,
  userId: string,
): Promise<boolean> {
  const response = await crmGraphQLRequest<{
    removeWorkerFromWarehouse: boolean;
  }>({
    query: REMOVE_WORKER,
    variables: { warehouseId, userId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || "Failed to remove worker");
  }

  return true;
}

/**
 * Update warehouse settings
 */
export async function updateWarehouseSettings(
  input: WarehouseSettingsInput,
): Promise<WarehouseSettings> {
  const response = await crmGraphQLRequest<{
    updateWarehouseSettings: WarehouseSettings;
  }>({
    query: UPDATE_WAREHOUSE_SETTINGS,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to update warehouse settings",
    );
  }

  if (!response.data?.updateWarehouseSettings) {
    throw new Error("No settings returned from update mutation");
  }

  return response.data.updateWarehouseSettings;
}

// Map numeric codes to GraphQL enum string values
const CODE_TO_ENUM: Record<number, string> = {
  1: "SECTION",
  2: "AISLE",
  3: "SHELF",
  4: "BAY",
  5: "ROW",
  6: "BIN",
};

/**
 * Update warehouse structure (location levels)
 */
export async function updateWarehouseStructure(
  warehouseId: string,
  levels: WarehouseStructureLevelInput[],
): Promise<WarehouseStructure[]> {
  // Convert numeric codes to GraphQL enum string values
  const graphqlLevels = levels.map((level) => ({
    code: CODE_TO_ENUM[level.code] || level.code,
    levelOrder: level.levelOrder,
  }));

  const response = await crmGraphQLRequest<{
    updateWarehouseStructure: WarehouseStructure[];
  }>({
    query: UPDATE_WAREHOUSE_STRUCTURE,
    variables: { warehouseId, levels: graphqlLevels },
  });

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to update warehouse structure",
    );
  }

  return response.data?.updateWarehouseStructure || [];
}

// ============================================================================
// Address API Functions
// ============================================================================

/**
 * Fetch addresses for a warehouse (source type = FACTORY)
 */
export async function fetchWarehouseAddresses(
  warehouseId: string,
): Promise<WarehouseAddress[]> {
  const response = await crmGraphQLRequest<{
    addressesBySource: WarehouseAddress[];
  }>({
    query: GET_ADDRESSES_BY_SOURCE,
    variables: { sourceType: "FACTORY", sourceId: warehouseId },
  });

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to fetch warehouse addresses",
    );
  }

  return (response.data?.addressesBySource || []).map(
    normalizeWarehouseAddress,
  );
}

/**
 * Create a new address for a warehouse
 */
export async function createWarehouseAddress(
  warehouseId: string,
  address: Omit<AddressInput, "sourceId" | "sourceType"> & { addressType?: AddressType },
): Promise<WarehouseAddress> {
  // Transform addressType to addressTypes array for the API
  const { addressType, ...restAddress } = address;
  const input = {
    ...restAddress,
    sourceId: warehouseId,
    sourceType: "FACTORY",
    addressTypes: [address.addressType || "OTHER"],
  };

  const response = await crmGraphQLRequest<{ createAddress: WarehouseAddress }>(
    {
      query: CREATE_ADDRESS,
      variables: { input },
    },
  );

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to create warehouse address",
    );
  }

  if (!response.data?.createAddress) {
    throw new Error("No address returned from create mutation");
  }

  return normalizeWarehouseAddress(response.data.createAddress);
}

/**
 * Update an existing warehouse address
 */
export async function updateWarehouseAddress(
  addressId: string,
  warehouseId: string,
  address: Omit<AddressInput, "sourceId" | "sourceType"> & { addressType?: AddressType },
): Promise<WarehouseAddress> {
  // Transform addressType to addressTypes array for the API
  const { addressType, ...restAddress } = address;
  const input = {
    ...restAddress,
    sourceId: warehouseId,
    sourceType: "FACTORY",
    addressTypes: [address.addressType || "OTHER"],
  };

  const response = await crmGraphQLRequest<{ updateAddress: WarehouseAddress }>(
    {
      query: UPDATE_ADDRESS,
      variables: { id: addressId, input },
    },
  );

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to update warehouse address",
    );
  }

  if (!response.data?.updateAddress) {
    throw new Error("No address returned from update mutation");
  }

  return normalizeWarehouseAddress(response.data.updateAddress);
}

/**
 * Delete a warehouse address
 */
export async function deleteWarehouseAddress(
  addressId: string,
): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteAddress: boolean }>({
    query: DELETE_ADDRESS,
    variables: { id: addressId },
  });

  if (response.errors) {
    throw new Error(
      response.errors[0]?.message || "Failed to delete warehouse address",
    );
  }

  return true;
}
