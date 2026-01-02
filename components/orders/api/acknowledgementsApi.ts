/**
 * Acknowledgements API Module
 * Re-exports from centralized GraphQL module for backward compatibility
 */

// Import everything for local use in hooks
import {
  fetchAcknowledgementById as _fetchAcknowledgementById,
  fetchAcknowledgementsByOrder as _fetchAcknowledgementsByOrder,
  fetchAcknowledgementsLandingPageByOrder as _fetchAcknowledgementsLandingPageByOrder,
  fetchAcknowledgementsByOrderDetail as _fetchAcknowledgementsByOrderDetail,
  createAcknowledgement as _createAcknowledgement,
  updateAcknowledgement as _updateAcknowledgement,
  deleteAcknowledgement as _deleteAcknowledgement,
  type OrderAcknowledgement,
  type AcknowledgementLandingPage,
  type CreateAcknowledgementInput,
  type UpdateAcknowledgementInput,
} from '../../lib/graphql/acknowledgements';

// Re-export everything from the centralized acknowledgements module
export {
  fetchAcknowledgementById,
  fetchAcknowledgementsByOrder,
  fetchAcknowledgementsLandingPageByOrder,
  fetchAcknowledgementsByOrderDetail,
  createAcknowledgement,
  updateAcknowledgement,
  deleteAcknowledgement,
  type OrderAcknowledgement,
  type AcknowledgementLandingPage,
  type AcknowledgementCreationType,
  type CreateAcknowledgementInput,
  type UpdateAcknowledgementInput,
  type FindAcknowledgementsLandingPagesResponse,
} from '../../lib/graphql/acknowledgements';

// ============================================================================
// React Query Hooks (Optional - for component use)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch a single acknowledgement
 */
export function useAcknowledgement(acknowledgementId: string | null) {
  return useQuery({
    queryKey: ['acknowledgement', acknowledgementId],
    queryFn: () => (acknowledgementId ? _fetchAcknowledgementById(acknowledgementId) : null),
    enabled: !!acknowledgementId,
  });
}

/**
 * Hook to fetch acknowledgements for an order (basic query)
 */
export function useOrderAcknowledgements(orderId: string | null) {
  return useQuery({
    queryKey: ['orderAcknowledgements', orderId],
    queryFn: () => (orderId ? _fetchAcknowledgementsByOrder(orderId) : []),
    enabled: !!orderId,
  });
}

/**
 * Hook to fetch acknowledgements for an order using landing page (enriched data)
 */
export function useOrderAcknowledgementsLandingPage(orderNumber: string | null) {
  return useQuery({
    queryKey: ['orderAcknowledgementsLandingPage', orderNumber],
    queryFn: () => (orderNumber ? _fetchAcknowledgementsLandingPageByOrder(orderNumber) : []),
    enabled: !!orderNumber,
  });
}

/**
 * Hook to fetch acknowledgements for a specific order detail (line item)
 */
export function useOrderDetailAcknowledgements(orderDetailId: string | null) {
  return useQuery({
    queryKey: ['orderDetailAcknowledgements', orderDetailId],
    queryFn: () => (orderDetailId ? _fetchAcknowledgementsByOrderDetail(orderDetailId) : []),
    enabled: !!orderDetailId,
  });
}

/**
 * Hook to create an acknowledgement
 */
export function useCreateAcknowledgement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAcknowledgementInput) => _createAcknowledgement(input),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['orderAcknowledgements', data.orderId] });
      if (data.orderDetailId) {
        queryClient.invalidateQueries({ queryKey: ['orderDetailAcknowledgements', data.orderDetailId] });
      }
    },
  });
}

/**
 * Hook to update an acknowledgement
 */
export function useUpdateAcknowledgement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAcknowledgementInput) => _updateAcknowledgement(input),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['acknowledgement', data.id] });
      queryClient.invalidateQueries({ queryKey: ['orderAcknowledgements', data.orderId] });
      if (data.orderDetailId) {
        queryClient.invalidateQueries({ queryKey: ['orderDetailAcknowledgements', data.orderDetailId] });
      }
    },
  });
}

/**
 * Hook to delete an acknowledgement
 */
export function useDeleteAcknowledgement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => _deleteAcknowledgement(id),
    onSuccess: () => {
      // Invalidate all acknowledgement queries
      queryClient.invalidateQueries({ queryKey: ['orderAcknowledgements'] });
      queryClient.invalidateQueries({ queryKey: ['orderDetailAcknowledgements'] });
    },
  });
}
