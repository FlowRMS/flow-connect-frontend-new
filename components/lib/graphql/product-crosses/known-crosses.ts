/**
 * Known Product Crosses Functions
 * CRUD operations for known product cross-references in the database
 */

import { flowAIGraphQLRequest } from '../flow-ai-client';
import {
  GET_KNOWN_PRODUCT_CROSS,
  GET_KNOWN_PRODUCT_CROSSES,
  GET_KNOWN_PRODUCT_CROSSES_PAGINATED,
} from './queries';
import {
  CREATE_KNOWN_PRODUCT_CROSS,
  UPDATE_KNOWN_PRODUCT_CROSS,
  DELETE_KNOWN_PRODUCT_CROSS,
  INCREMENT_KNOWN_PRODUCT_CROSS_USAGE,
  BULK_CREATE_KNOWN_PRODUCT_CROSSES,
} from './mutations';
import type {
  KnownProductCross,
  KnownProductCrossListResult,
  KnownProductCrossFilters,
  CreateKnownProductCrossInput,
  UpdateKnownProductCrossInput,
  BulkKnownProductCrossInput,
} from './types';

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get a single known product cross by ID
 */
export async function getKnownProductCross(productCrossId: string): Promise<KnownProductCross | null> {
  const response = await flowAIGraphQLRequest<{ getProductCross: KnownProductCross | null }>({
    query: GET_KNOWN_PRODUCT_CROSS,
    variables: { productCrossId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get product cross');
  }

  return response.data?.getProductCross || null;
}

/**
 * Get known product crosses with filtering and pagination
 */
export async function getKnownProductCrosses(
  filters: KnownProductCrossFilters = {}
): Promise<KnownProductCross[]> {
  const response = await flowAIGraphQLRequest<{ getProductCrosses: KnownProductCross[] }>({
    query: GET_KNOWN_PRODUCT_CROSSES,
    variables: filters,
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get product crosses');
  }

  return response.data?.getProductCrosses || [];
}

/**
 * Get known product crosses with total count for pagination
 */
export async function getKnownProductCrossesPaginated(
  filters: KnownProductCrossFilters = {}
): Promise<KnownProductCrossListResult> {
  const response = await flowAIGraphQLRequest<{ getProductCrossesPaginated: KnownProductCrossListResult }>({
    query: GET_KNOWN_PRODUCT_CROSSES_PAGINATED,
    variables: filters,
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get product crosses');
  }

  return response.data?.getProductCrossesPaginated || { crosses: [], totalCount: 0 };
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Create a new known product cross
 */
export async function createKnownProductCross(
  input: CreateKnownProductCrossInput
): Promise<KnownProductCross> {
  try {
    const response = await flowAIGraphQLRequest<{ createProductCross: KnownProductCross }>({
      query: CREATE_KNOWN_PRODUCT_CROSS,
      variables: { input },
    });
    if (response.errors) {
      console.error('🔵 [createKnownProductCross] GraphQL errors:', response.errors);
      throw new Error(response.errors[0]?.message || 'Failed to create product cross');
    }

    if (!response.data?.createProductCross) {
      console.error('🔵 [createKnownProductCross] No data returned');
      throw new Error('Failed to create product cross');
    }
    return response.data.createProductCross;
  } catch (error) {
    console.error('🔵 [createKnownProductCross] EXCEPTION caught:', error);
    throw error;
  }
}

/**
 * Update an existing known product cross
 */
export async function updateKnownProductCross(
  productCrossId: string,
  input: UpdateKnownProductCrossInput
): Promise<KnownProductCross> {
  const response = await flowAIGraphQLRequest<{ updateProductCross: KnownProductCross }>({
    query: UPDATE_KNOWN_PRODUCT_CROSS,
    variables: { productCrossId, input },
  });
  if (response.errors) {
    console.error('🔴 [updateKnownProductCross] GraphQL errors:', JSON.stringify(response.errors, null, 2));
    throw new Error(response.errors[0]?.message || 'Failed to update product cross');
  }

  if (!response.data?.updateProductCross) {
    throw new Error('Failed to update product cross');
  }

  return response.data.updateProductCross;
}

/**
 * Delete a known product cross
 */
export async function deleteKnownProductCross(productCrossId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deleteProductCross: boolean }>({
    query: DELETE_KNOWN_PRODUCT_CROSS,
    variables: { productCrossId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to delete product cross');
  }

  return response.data?.deleteProductCross || false;
}

/**
 * Increment usage count for a known product cross
 */
export async function incrementKnownProductCrossUsage(
  productCrossId: string
): Promise<KnownProductCross> {
  const response = await flowAIGraphQLRequest<{ incrementProductCrossUsage: KnownProductCross }>({
    query: INCREMENT_KNOWN_PRODUCT_CROSS_USAGE,
    variables: { productCrossId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to increment usage');
  }

  if (!response.data?.incrementProductCrossUsage) {
    throw new Error('Failed to increment usage');
  }

  return response.data.incrementProductCrossUsage;
}

/**
 * Bulk create known product crosses
 */
export async function bulkCreateKnownProductCrosses(
  crosses: BulkKnownProductCrossInput[]
): Promise<KnownProductCross[]> {
  const response = await flowAIGraphQLRequest<{ bulkCreateProductCrosses: KnownProductCross[] }>({
    query: BULK_CREATE_KNOWN_PRODUCT_CROSSES,
    variables: { crosses },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to bulk create product crosses');
  }

  return response.data?.bulkCreateProductCrosses || [];
}
