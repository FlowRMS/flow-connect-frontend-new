/**
 * Container Types API Module
 * GraphQL API for warehouse container types CRUD operations
 */

import { crmGraphQLRequest } from '../../../lib/graphql/client';

// ============================================================================
// Types
// ============================================================================

export interface ContainerType {
  id: string;
  name: string;
  length: number; // in inches
  width: number; // in inches
  height: number; // in inches
  weight: number; // tare weight in lbs
  position: number; // display position
  createdAt?: string;
}

export interface CreateContainerTypeInput {
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  position?: number;
}

export interface UpdateContainerTypeInput {
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  position?: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_CONTAINER_TYPES = `
  query GetContainerTypes {
    containerTypes {
      id
      name
      length
      width
      height
      weight
      position
      createdAt
    }
  }
`;

const GET_CONTAINER_TYPE = `
  query GetContainerType($id: UUID!) {
    containerType(id: $id) {
      id
      name
      length
      width
      height
      weight
      position
      createdAt
    }
  }
`;

const CREATE_CONTAINER_TYPE = `
  mutation CreateContainerType($input: ContainerTypeInput!) {
    createContainerType(input: $input) {
      id
      name
      length
      width
      height
      weight
      position
      createdAt
    }
  }
`;

const UPDATE_CONTAINER_TYPE = `
  mutation UpdateContainerType($id: UUID!, $input: ContainerTypeInput!) {
    updateContainerType(id: $id, input: $input) {
      id
      name
      length
      width
      height
      weight
      position
      createdAt
    }
  }
`;

const DELETE_CONTAINER_TYPE = `
  mutation DeleteContainerType($id: UUID!) {
    deleteContainerType(id: $id)
  }
`;

const REORDER_CONTAINER_TYPES = `
  mutation ReorderContainerTypes($orderedIds: [UUID!]!) {
    reorderContainerTypes(orderedIds: $orderedIds) {
      id
      name
      length
      width
      height
      weight
      position
      createdAt
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all container types ordered by display position
 */
export async function fetchContainerTypes(): Promise<ContainerType[]> {
  const response = await crmGraphQLRequest<{ containerTypes: ContainerType[] }>({
    query: GET_CONTAINER_TYPES,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch container types');
  }

  return response.data?.containerTypes || [];
}

/**
 * Fetch a single container type by ID
 */
export async function fetchContainerTypeById(id: string): Promise<ContainerType | null> {
  const response = await crmGraphQLRequest<{ containerType: ContainerType }>({
    query: GET_CONTAINER_TYPE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch container type');
  }

  return response.data?.containerType || null;
}

/**
 * Create a new container type
 */
export async function createContainerType(input: CreateContainerTypeInput): Promise<ContainerType> {
  const response = await crmGraphQLRequest<{ createContainerType: ContainerType }>({
    query: CREATE_CONTAINER_TYPE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create container type');
  }

  if (!response.data?.createContainerType) {
    throw new Error('No container type returned from create mutation');
  }

  return response.data.createContainerType;
}

/**
 * Update an existing container type
 */
export async function updateContainerType(
  id: string,
  input: UpdateContainerTypeInput
): Promise<ContainerType> {
  const response = await crmGraphQLRequest<{ updateContainerType: ContainerType }>({
    query: UPDATE_CONTAINER_TYPE,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update container type');
  }

  if (!response.data?.updateContainerType) {
    throw new Error('No container type returned from update mutation');
  }

  return response.data.updateContainerType;
}

/**
 * Delete a container type
 */
export async function deleteContainerType(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteContainerType: boolean }>({
    query: DELETE_CONTAINER_TYPE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete container type');
  }

  return true;
}

/**
 * Reorder container types based on the provided ID list
 */
export async function reorderContainerTypes(orderedIds: string[]): Promise<ContainerType[]> {
  const response = await crmGraphQLRequest<{ reorderContainerTypes: ContainerType[] }>({
    query: REORDER_CONTAINER_TYPES,
    variables: { orderedIds },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to reorder container types');
  }

  return response.data?.reorderContainerTypes || [];
}
