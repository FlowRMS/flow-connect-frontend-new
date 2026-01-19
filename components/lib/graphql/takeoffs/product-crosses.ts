/**
 * Takeoffs Product Cross Persistence Functions
 * Save, select, and delete product cross alternatives
 */

import { flowAIGraphQLRequest } from '../flow-ai-client';
import { GET_TAKEOFF_PRODUCT_CROSSES } from './queries';
import {
  SAVE_PRODUCT_CROSS,
  SELECT_CROSS_ALTERNATIVE,
  DELETE_CROSS_ALTERNATIVE,
  DELETE_PRODUCT_CROSS,
  CLEAR_TAKEOFF_CROSSES,
} from './mutations';
import type {
  SaveProductCrossInput,
  TakeoffProductCrossResponse,
} from './types';

/**
 * Save a product cross result to persist it to the database
 */
export async function saveProductCross(
  input: SaveProductCrossInput
): Promise<TakeoffProductCrossResponse> {
  const response = await flowAIGraphQLRequest<{ saveProductCross: TakeoffProductCrossResponse }>({
    query: SAVE_PRODUCT_CROSS,
    variables: {
      input: {
        takeoffId: input.takeoffId,
        originalManufacturer: input.originalManufacturer,
        originalPartNumber: input.originalPartNumber,
        originalDescription: input.originalDescription,
        originalAttributes: input.originalAttributes,
        alternatives: input.alternatives.map(alt => ({
          name: alt.name,
          description: alt.description,
          price: alt.price,
          source: alt.source,
          crossType: alt.crossType,
          attributes: alt.attributes,
          reasoning: alt.reasoning,
          selected: alt.selected || false,
        })),
        crossTypesUsed: input.crossTypesUsed,
        promptUsed: input.promptUsed,
      },
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to save product cross');
  }

  if (!response.data?.saveProductCross) {
    throw new Error('No product cross returned from save mutation');
  }

  return response.data.saveProductCross;
}

/**
 * Select an alternative in a product cross (persists to database)
 */
export async function selectCrossAlternative(
  crossId: string,
  alternativeIndex: number
): Promise<TakeoffProductCrossResponse> {
  const response = await flowAIGraphQLRequest<{ selectCrossAlternative: TakeoffProductCrossResponse }>({
    query: SELECT_CROSS_ALTERNATIVE,
    variables: { crossId, alternativeIndex },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to select cross alternative');
  }

  if (!response.data?.selectCrossAlternative) {
    throw new Error('No product cross returned from select mutation');
  }

  return response.data.selectCrossAlternative;
}

/**
 * Delete an alternative from a product cross (persists to database)
 */
export async function deleteCrossAlternative(
  crossId: string,
  alternativeIndex: number
): Promise<TakeoffProductCrossResponse | null> {
  const response = await flowAIGraphQLRequest<{ deleteCrossAlternative: TakeoffProductCrossResponse | null }>({
    query: DELETE_CROSS_ALTERNATIVE,
    variables: { crossId, alternativeIndex },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete cross alternative');
  }

  return response.data?.deleteCrossAlternative || null;
}

/**
 * Delete an entire product cross
 */
export async function deleteProductCross(crossId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deleteProductCross: boolean }>({
    query: DELETE_PRODUCT_CROSS,
    variables: { crossId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product cross');
  }

  return response.data?.deleteProductCross || false;
}

/**
 * Clear all product crosses for a takeoff
 */
export async function clearTakeoffCrosses(takeoffId: string): Promise<number> {
  const response = await flowAIGraphQLRequest<{ clearTakeoffCrosses: number }>({
    query: CLEAR_TAKEOFF_CROSSES,
    variables: { takeoffId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to clear takeoff crosses');
  }

  return response.data?.clearTakeoffCrosses || 0;
}

/**
 * Get all saved product crosses for a takeoff
 */
export async function getTakeoffProductCrosses(
  takeoffId: string
): Promise<TakeoffProductCrossResponse[]> {
  try {
    const response = await flowAIGraphQLRequest<{ getTakeoffProductCrosses: TakeoffProductCrossResponse[] }>({
      query: GET_TAKEOFF_PRODUCT_CROSSES,
      variables: { takeoffId },
    });

    if (response.errors) {
      console.warn('getTakeoffProductCrosses query not available:', response.errors[0]?.message);
      return [];
    }

    return response.data?.getTakeoffProductCrosses || [];
  } catch (error) {
    console.warn('Failed to fetch product crosses (query may not exist):', error);
    return [];
  }
}
