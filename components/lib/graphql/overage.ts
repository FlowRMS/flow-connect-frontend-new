/**
 * Overage GraphQL Module
 * Queries for overage calculations and commission rates
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

/**
 * Overage calculation mode
 */
export type OverageTypeEnum = 'BY_LINE' | 'BY_TOTAL';

/**
 * Result of overage calculation
 */
export interface OverageRecord {
  effectiveCommissionRate: number | null;
  overageUnitPrice: number | null;
  baseUnitPrice: number | null;
  repShare: number | null;
  levelRate: number | null;
  levelUnitPrice: number | null;
  overageType: OverageTypeEnum | null;
  errorMessage: string | null;
  success: boolean;
}

/**
 * Input parameters for overage calculation
 */
export interface OverageCalculationInput {
  productId: string;
  detailUnitPrice: number;
  factoryId: string;
  endUserId: string;
  quantity?: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_EFFECTIVE_COMMISSION_RATE_AND_OVERAGE_QUERY = `
  query FindEffectiveCommissionRateAndOverage(
    $productId: ID!
    $detailUnitPrice: Float!
    $factoryId: ID!
    $endUserId: ID!
    $quantity: Float
  ) {
    findEffectiveCommissionRateAndOverageUnitPriceByProduct(
      productId: $productId
      detailUnitPrice: $detailUnitPrice
      factoryId: $factoryId
      endUserId: $endUserId
      quantity: $quantity
    ) {
      effectiveCommissionRate
      overageUnitPrice
      baseUnitPrice
      repShare
      levelRate
      levelUnitPrice
      overageType
      errorMessage
      success
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Calculate effective commission rate and overage for a product
 *
 * @param input - The calculation input parameters
 * @returns OverageRecord with calculated values
 */
export async function findEffectiveCommissionRateAndOverage(
  input: OverageCalculationInput
): Promise<OverageRecord> {
  const response = await crmGraphQLRequest<{
    findEffectiveCommissionRateAndOverageUnitPriceByProduct: OverageRecord;
  }>({
    query: FIND_EFFECTIVE_COMMISSION_RATE_AND_OVERAGE_QUERY,
    variables: {
      productId: input.productId,
      detailUnitPrice: input.detailUnitPrice,
      factoryId: input.factoryId,
      endUserId: input.endUserId,
      quantity: input.quantity ?? 1.0,
    },
  });

  if (response.errors) {
    console.error('Overage calculation GraphQL errors:', response.errors);
  }

  return response.data?.findEffectiveCommissionRateAndOverageUnitPriceByProduct as OverageRecord;
}

/**
 * Calculate overage for multiple line items (batch)
 *
 * @param items - Array of line items to calculate
 * @returns Array of OverageRecord for each item
 */
export async function calculateOverageForLineItems(
  items: OverageCalculationInput[]
): Promise<OverageRecord[]> {
  // Execute in parallel
  const results = await Promise.all(
    items.map((item) => findEffectiveCommissionRateAndOverage(item))
  );
  return results;
}
