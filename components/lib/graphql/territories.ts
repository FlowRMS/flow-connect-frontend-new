import { crmGraphQLRequest } from './client';

// =============================================================================
// Types
// =============================================================================

export type TerritoryType = 'REGION' | 'SUBREGION' | 'TERRITORY';

export interface TerritoryLite {
  id: string;
  name: string;
  code: string;
  territoryType: TerritoryType;
  parentId: string | null;
  active: boolean;
  createdAt?: string;
}

export interface TerritorySplitRate {
  id: string;
  territoryId: string;
  userId: string;
  splitRate: string;
  position: number;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    email?: string;
  };
}

export interface TerritoryManager {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email?: string;
}

export interface Territory extends TerritoryLite {
  zipCodes: string[];
  countyCodes: string[];
  cityNames: string[];
  stateCodes: string[];
  parent: TerritoryLite | null;
  splitRates: TerritorySplitRate[];
  managers: TerritoryManager[];
}

export interface SplitRateInput {
  userId: string;
  splitRate: string;
  position: number;
}

export interface TerritoryInput {
  name: string;
  code: string;
  territoryType: TerritoryType;
  parentId?: string | null;
  active?: boolean;
  zipCodes?: string[];
  countyCodes?: string[];
  cityNames?: string[];
  stateCodes?: string[];
  splitRates?: SplitRateInput[];
}

// =============================================================================
// GraphQL Fragments
// =============================================================================

const TERRITORY_LITE_FRAGMENT = `
  id
  name
  code
  territoryType
  parentId
  active
  createdAt
`;

const TERRITORY_SPLIT_RATE_FRAGMENT = `
  id
  territoryId
  userId
  splitRate
  position
  user {
    id
    firstName
    lastName
    fullName
    email
  }
`;

const TERRITORY_MANAGER_FRAGMENT = `
  id
  firstName
  lastName
  fullName
  email
`;

const TERRITORY_FULL_FRAGMENT = `
  ${TERRITORY_LITE_FRAGMENT}
  zipCodes
  countyCodes
  cityNames
  stateCodes
  parent {
    ${TERRITORY_LITE_FRAGMENT}
  }
  splitRates {
    ${TERRITORY_SPLIT_RATE_FRAGMENT}
  }
  managers {
    ${TERRITORY_MANAGER_FRAGMENT}
  }
`;

// =============================================================================
// Queries
// =============================================================================

const GET_TERRITORY = `
  query GetTerritory($id: UUID!) {
    territory(id: $id) {
      ${TERRITORY_FULL_FRAGMENT}
    }
  }
`;

const GET_TERRITORIES_BY_TYPE = `
  query TerritoriesByType($territoryType: TerritoryTypeEnum!, $activeOnly: Boolean) {
    territoriesByType(territoryType: $territoryType, activeOnly: $activeOnly) {
      ${TERRITORY_LITE_FRAGMENT}
    }
  }
`;

const GET_TERRITORY_CHILDREN = `
  query TerritoryChildren($parentId: UUID!) {
    territoryChildren(parentId: $parentId) {
      ${TERRITORY_LITE_FRAGMENT}
    }
  }
`;

const GET_TERRITORY_HIERARCHY = `
  query TerritoryHierarchy($territoryId: UUID!) {
    territoryHierarchy(territoryId: $territoryId) {
      ${TERRITORY_LITE_FRAGMENT}
    }
  }
`;

const GET_ALL_TERRITORIES = `
  query AllTerritories {
    allTerritories {
      ${TERRITORY_LITE_FRAGMENT}
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

const CREATE_TERRITORY = `
  mutation CreateTerritory($input: TerritoryInput!) {
    createTerritory(input: $input) {
      ${TERRITORY_FULL_FRAGMENT}
    }
  }
`;

const UPDATE_TERRITORY = `
  mutation UpdateTerritory($id: UUID!, $input: TerritoryInput!) {
    updateTerritory(id: $id, input: $input) {
      ${TERRITORY_FULL_FRAGMENT}
    }
  }
`;

const DELETE_TERRITORY = `
  mutation DeleteTerritory($id: UUID!) {
    deleteTerritory(id: $id)
  }
`;

const ASSIGN_TERRITORY_MANAGER = `
  mutation AssignTerritoryManager($territoryId: UUID!, $userId: UUID!) {
    assignTerritoryManager(territoryId: $territoryId, userId: $userId) {
      id
      managers {
        id
        firstName
        lastName
        fullName
        email
      }
    }
  }
`;

const REMOVE_TERRITORY_MANAGER = `
  mutation RemoveTerritoryManager($territoryId: UUID!, $userId: UUID!) {
    removeTerritoryManager(territoryId: $territoryId, userId: $userId)
  }
`;

// =============================================================================
// API Functions
// =============================================================================

export async function fetchTerritory(id: string): Promise<Territory> {
  const response = await crmGraphQLRequest<{ territory: Territory }>({
    query: GET_TERRITORY,
    variables: { id },
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to fetch territory');
  }
  if (!response.data?.territory) {
    throw new Error('Failed to fetch territory');
  }
  return response.data.territory;
}

export async function fetchTerritoriesByType(
  territoryType: TerritoryType,
  activeOnly: boolean = true
): Promise<TerritoryLite[]> {
  const response = await crmGraphQLRequest<{ territoriesByType: TerritoryLite[] }>({
    query: GET_TERRITORIES_BY_TYPE,
    variables: { territoryType, activeOnly },
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to fetch territories');
  }
  if (!response.data?.territoriesByType) {
    throw new Error('Failed to fetch territories');
  }
  return response.data.territoriesByType;
}

export async function fetchTerritoryChildren(parentId: string): Promise<TerritoryLite[]> {
  const response = await crmGraphQLRequest<{ territoryChildren: TerritoryLite[] }>({
    query: GET_TERRITORY_CHILDREN,
    variables: { parentId },
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to fetch territory children');
  }
  if (!response.data?.territoryChildren) {
    throw new Error('Failed to fetch territory children');
  }
  return response.data.territoryChildren;
}

export async function fetchTerritoryHierarchy(territoryId: string): Promise<TerritoryLite[]> {
  const response = await crmGraphQLRequest<{ territoryHierarchy: TerritoryLite[] }>({
    query: GET_TERRITORY_HIERARCHY,
    variables: { territoryId },
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to fetch territory hierarchy');
  }
  if (!response.data?.territoryHierarchy) {
    throw new Error('Failed to fetch territory hierarchy');
  }
  return response.data.territoryHierarchy;
}

export async function fetchAllTerritories(): Promise<TerritoryLite[]> {
  const response = await crmGraphQLRequest<{ allTerritories: TerritoryLite[] }>({
    query: GET_ALL_TERRITORIES,
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to fetch all territories');
  }
  if (!response.data?.allTerritories) {
    throw new Error('Failed to fetch all territories');
  }
  return response.data.allTerritories;
}

export async function createTerritory(input: TerritoryInput): Promise<Territory> {
  const response = await crmGraphQLRequest<{ createTerritory: Territory }>({
    query: CREATE_TERRITORY,
    variables: { input },
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to create territory');
  }
  if (!response.data?.createTerritory) {
    throw new Error('Failed to create territory');
  }
  return response.data.createTerritory;
}

export async function updateTerritory(id: string, input: TerritoryInput): Promise<Territory> {
  const response = await crmGraphQLRequest<{ updateTerritory: Territory }>({
    query: UPDATE_TERRITORY,
    variables: { id, input },
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to update territory');
  }
  if (!response.data?.updateTerritory) {
    throw new Error('Failed to update territory');
  }
  return response.data.updateTerritory;
}

export async function deleteTerritory(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteTerritory: boolean }>({
    query: DELETE_TERRITORY,
    variables: { id },
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to delete territory');
  }
  if (response.data?.deleteTerritory === undefined) {
    throw new Error('Failed to delete territory');
  }
  return response.data.deleteTerritory;
}

export async function assignTerritoryManager(
  territoryId: string,
  userId: string
): Promise<{ id: string; managers: TerritoryManager[] }> {
  const response = await crmGraphQLRequest<{ assignTerritoryManager: { id: string; managers: TerritoryManager[] } }>({
    query: ASSIGN_TERRITORY_MANAGER,
    variables: { territoryId, userId },
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to assign territory manager');
  }
  if (!response.data?.assignTerritoryManager) {
    throw new Error('Failed to assign territory manager');
  }
  return response.data.assignTerritoryManager;
}

export async function removeTerritoryManager(
  territoryId: string,
  userId: string
): Promise<boolean> {
  const response = await crmGraphQLRequest<{ removeTerritoryManager: boolean }>({
    query: REMOVE_TERRITORY_MANAGER,
    variables: { territoryId, userId },
  });
  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].message || 'Failed to remove territory manager');
  }
  if (response.data?.removeTerritoryManager === undefined) {
    throw new Error('Failed to remove territory manager');
  }
  return response.data.removeTerritoryManager;
}

// =============================================================================
// Helper Functions
// =============================================================================

export function getTerritoryTypeLabel(type: TerritoryType): string {
  switch (type) {
    case 'REGION':
      return 'Region';
    case 'SUBREGION':
      return 'Subregion';
    case 'TERRITORY':
      return 'Territory';
    default:
      return type;
  }
}

export function getTerritoryTypeColor(type: TerritoryType): string {
  switch (type) {
    case 'REGION':
      return 'bg-blue-100 text-blue-700';
    case 'SUBREGION':
      return 'bg-purple-100 text-purple-700';
    case 'TERRITORY':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getChildTerritoryType(parentType: TerritoryType | null): TerritoryType | null {
  switch (parentType) {
    case null:
      return 'REGION';
    case 'REGION':
      return 'SUBREGION';
    case 'SUBREGION':
      return 'TERRITORY';
    case 'TERRITORY':
      return null; // Cannot have children
    default:
      return null;
  }
}

export function validateSplitRates(splitRates: SplitRateInput[]): { valid: boolean; error?: string } {
  if (splitRates.length === 0) {
    return { valid: true };
  }

  const total = splitRates.reduce((sum, sr) => sum + parseFloat(sr.splitRate || '0'), 0);

  if (Math.abs(total - 100) > 0.01) {
    return {
      valid: false,
      error: `Split rates must total 100%. Current total: ${total.toFixed(2)}%`
    };
  }

  const userIds = splitRates.map(sr => sr.userId);
  const uniqueUserIds = new Set(userIds);
  if (userIds.length !== uniqueUserIds.size) {
    return { valid: false, error: 'Each rep can only appear once in split rates' };
  }

  return { valid: true };
}

export function generateTerritoryCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 20);
}
