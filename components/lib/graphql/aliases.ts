/**
 * GraphQL API for Alias Management
 * Handles CRUD operations for entity aliases (products, customers, manufacturers)
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type AliasEntityType = 'CUSTOMER' | 'PRODUCT' | 'FACTORY';
export type AliasSubType = 'END_USER' | 'SOLD_TO' | 'BILL_TO' | null;

export interface Alias {
  id: string;
  alias: string;
  entityId: string;
  entityType: AliasEntityType;
  subType: AliasSubType;
  createdAt: string;
}

export interface CreateAliasInput {
  entityId: string;
  entityType: AliasEntityType;
  alias: string;
  subType?: AliasSubType;
}

export interface UpdateAliasInput {
  id: string;
  entityId: string;
  entityType: AliasEntityType;
  alias: string;
  subType?: AliasSubType;
}

export interface AliasSearchParams {
  searchTerm: string;
  entityType?: AliasEntityType;
  subType?: AliasSubType;
  limit?: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_ALIAS_BY_ID = `
  query GetAliasById($id: UUID!) {
    alias(id: $id) {
      id
      alias
      entityId
      entityType
      subType
      createdAt
    }
  }
`;

const GET_ALIASES_BY_ENTITY = `
  query GetAliasesByEntity($entityId: UUID!, $entityType: AliasEntityType!, $subType: AliasSubType) {
    aliasesByEntity(entityId: $entityId, entityType: $entityType, subType: $subType) {
      id
      alias
      entityId
      entityType
      subType
      createdAt
    }
  }
`;

const SEARCH_ALIASES = `
  query SearchAliases($searchTerm: String!, $entityType: AliasEntityType, $subType: AliasSubType, $limit: Int!) {
    aliasSearch(searchTerm: $searchTerm, entityType: $entityType, subType: $subType, limit: $limit) {
      id
      alias
      entityId
      entityType
      subType
      createdAt
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_ALIAS = `
  mutation CreateAlias($input: AliasInput!) {
    createAlias(input: $input) {
      id
      alias
      entityId
      entityType
      subType
      createdAt
    }
  }
`;

const UPDATE_ALIAS = `
  mutation UpdateAlias($input: AliasInput!) {
    updateAlias(input: $input) {
      id
      alias
      entityId
      entityType
      subType
      createdAt
    }
  }
`;

const DELETE_ALIAS = `
  mutation DeleteAlias($id: UUID!) {
    deleteAlias(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get an alias by ID
 */
export async function fetchAliasById(id: string): Promise<Alias | null> {
  const response = await crmGraphQLRequest<{ alias: Alias }>({
    query: GET_ALIAS_BY_ID,
    variables: { id },
  });

  if (response.errors?.length) {
    console.error('Failed to fetch alias:', response.errors);
    throw new Error(response.errors[0].message);
  }

  return response.data?.alias || null;
}

/**
 * Get all aliases for a specific entity
 */
export async function fetchAliasesByEntity(
  entityId: string,
  entityType: AliasEntityType,
  subType?: AliasSubType
): Promise<Alias[]> {
  const response = await crmGraphQLRequest<{ aliasesByEntity: Alias[] }>({
    query: GET_ALIASES_BY_ENTITY,
    variables: { entityId, entityType, subType },
  });

  if (response.errors?.length) {
    console.error('Failed to fetch aliases:', response.errors);
    throw new Error(response.errors[0].message);
  }

  return response.data?.aliasesByEntity || [];
}

/**
 * Search for aliases across entities
 */
export async function searchAliases(params: AliasSearchParams): Promise<Alias[]> {
  const response = await crmGraphQLRequest<{ aliasSearch: Alias[] }>({
    query: SEARCH_ALIASES,
    variables: {
      searchTerm: params.searchTerm,
      entityType: params.entityType,
      subType: params.subType,
      limit: params.limit || 20,
    },
  });

  if (response.errors?.length) {
    console.error('Failed to search aliases:', response.errors);
    throw new Error(response.errors[0].message);
  }

  return response.data?.aliasSearch || [];
}

/**
 * Create a new alias
 */
export async function createAlias(input: CreateAliasInput): Promise<Alias> {
  const response = await crmGraphQLRequest<{ createAlias: Alias }>({
    query: CREATE_ALIAS,
    variables: { input },
  });

  if (response.errors?.length) {
    console.error('Failed to create alias:', response.errors);
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.createAlias) {
    throw new Error('Failed to create alias');
  }

  return response.data.createAlias;
}

/**
 * Update an existing alias
 */
export async function updateAlias(input: UpdateAliasInput): Promise<Alias> {
  const response = await crmGraphQLRequest<{ updateAlias: Alias }>({
    query: UPDATE_ALIAS,
    variables: { input },
  });

  if (response.errors?.length) {
    console.error('Failed to update alias:', response.errors);
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.updateAlias) {
    throw new Error('Failed to update alias');
  }

  return response.data.updateAlias;
}

/**
 * Delete an alias by ID
 */
export async function deleteAlias(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteAlias: boolean }>({
    query: DELETE_ALIAS,
    variables: { id },
  });

  if (response.errors?.length) {
    console.error('Failed to delete alias:', response.errors);
    throw new Error(response.errors[0].message);
  }

  return response.data?.deleteAlias ?? false;
}
