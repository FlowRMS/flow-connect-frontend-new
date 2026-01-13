/**
 * Bulk Operations GraphQL Module
 * Shared bulk operations like bulk delete for multiple entity types
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type BulkDeleteEntityType =
  | 'CUSTOMERS'
  | 'FACTORIES'
  | 'PRODUCTS'
  | 'ORDERS'
  | 'INVOICES'
  | 'QUOTES'
  | 'CHECKS'
  | 'PRE_OPS';

export interface BulkDeleteFailure {
  entityId: string;
  error: string;
}

export interface BulkDeleteResult {
  deletedCount: number;
  entityType: BulkDeleteEntityType;
  failedCount: number;
  failures: BulkDeleteFailure[];
}

// Entity display names for UI
export const ENTITY_DISPLAY_NAMES: Record<BulkDeleteEntityType, { singular: string; plural: string }> = {
  CUSTOMERS: { singular: 'customer', plural: 'customers' },
  FACTORIES: { singular: 'manufacturer', plural: 'manufacturers' },
  PRODUCTS: { singular: 'product', plural: 'products' },
  ORDERS: { singular: 'order', plural: 'orders' },
  INVOICES: { singular: 'invoice', plural: 'invoices' },
  QUOTES: { singular: 'quote', plural: 'quotes' },
  CHECKS: { singular: 'check', plural: 'checks' },
  PRE_OPS: { singular: 'pre-opportunity', plural: 'pre-opportunities' },
};

// ============================================================================
// GraphQL Mutations
// ============================================================================

const BULK_DELETE = `
  mutation BulkDelete($entityIds: [UUID!]!, $entityType: BulkDeleteEntityType!) {
    bulkDelete(entityIds: $entityIds, entityType: $entityType) {
      deletedCount
      entityType
      failedCount
      failures {
        error
        entityId
      }
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Bulk delete entities (customers, factories, products, orders, invoices, quotes, checks, or pre_ops)
 */
export async function bulkDelete(
  entityIds: string[],
  entityType: BulkDeleteEntityType
): Promise<BulkDeleteResult> {
  const response = await crmGraphQLRequest<{ bulkDelete: BulkDeleteResult }>({
    query: BULK_DELETE,
    variables: { entityIds, entityType },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to bulk delete');
  }

  if (!response.data?.bulkDelete) {
    throw new Error('No result returned from bulk delete mutation');
  }

  return response.data.bulkDelete;
}
