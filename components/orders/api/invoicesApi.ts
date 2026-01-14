/**
 * Invoices API Module for Orders
 * React Query hooks for fetching invoices related to orders
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { crmGraphQLRequest } from '../../lib/graphql/client';

// Re-export types from the centralized invoices module
export {
  type Invoice,
  type InvoiceLandingPage,
  type InvoiceBalance,
  type InvoiceUser,
  type InvoiceSplitRate,
  type InvoiceProduct,
  type InvoiceUom,
  type InvoiceFactory,
  type InvoiceOrder,
  type InvoiceDetail,
  type InvoiceCreationType,
  fetchInvoiceById,
} from '../../lib/graphql/invoices';

// ============================================================================
// Types for Order Invoices
// ============================================================================

export interface OrderInvoice {
  id: string;
  balanceId?: string;
  url?: string;
  status?: string;
  published?: boolean;
  orderId?: string;
  locked?: boolean;
  invoiceNumber?: string;
  entityDate?: string;
  dueDate?: string;
  creationType?: string;
  createdById?: string;
  createdAt?: string;
  total?: number;
  commission?: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const INVOICES_BY_ORDER_ID = `
  query InvoicesByOrderId($orderId: UUID!) {
    invoicesByOrderId(orderId: $orderId) {
      balanceId
      url
      status
      published
      orderId
      locked
      invoiceNumber
      id
      entityDate
      dueDate
      creationType
      createdById
      createdAt
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all invoices for a specific order
 */
export async function fetchInvoicesByOrderId(orderId: string): Promise<OrderInvoice[]> {
  const response = await crmGraphQLRequest<{ invoicesByOrderId: OrderInvoice[] }>({
    query: INVOICES_BY_ORDER_ID,
    variables: { orderId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch invoices for order');
  }

  return response.data?.invoicesByOrderId || [];
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch invoices for a specific order
 */
export function useOrderInvoices(orderId: string | null) {
  return useQuery({
    queryKey: ['orderInvoices', orderId],
    queryFn: () => (orderId ? fetchInvoicesByOrderId(orderId) : []),
    enabled: !!orderId,
  });
}

/**
 * Hook to invalidate order invoices cache
 */
export function useInvalidateOrderInvoices() {
  const queryClient = useQueryClient();

  return (orderId?: string) => {
    if (orderId) {
      queryClient.invalidateQueries({ queryKey: ['orderInvoices', orderId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['orderInvoices'] });
    }
  };
}
