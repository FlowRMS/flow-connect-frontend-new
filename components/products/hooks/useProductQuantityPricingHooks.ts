'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProductQuantityPricing, ProductQuantityPricingInput } from '../api';
import {
  fetchProductQuantityPricingById,
  listProductQuantityPricingByProductId,
  createProductQuantityPricing,
  updateProductQuantityPricing,
  deleteProductQuantityPricing,
} from '../api';
import { productQueryKeys } from './queryKeys';

export function useProductQuantityPricing(id: string) {
  return useQuery<ProductQuantityPricing | null, Error>({
    queryKey: productQueryKeys.quantityPricingItem(id),
    queryFn: () => fetchProductQuantityPricingById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useProductQuantityPricingList(productId: string) {
  return useQuery<ProductQuantityPricing[], Error>({
    queryKey: productQueryKeys.quantityPricing(productId),
    queryFn: () => listProductQuantityPricingByProductId(productId),
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
}

export function useCreateProductQuantityPricing() {
  const queryClient = useQueryClient();

  return useMutation<ProductQuantityPricing, Error, ProductQuantityPricingInput>({
    mutationFn: createProductQuantityPricing,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.quantityPricing(data.productId) });
    },
  });
}

export function useUpdateProductQuantityPricing() {
  const queryClient = useQueryClient();

  return useMutation<ProductQuantityPricing, Error, { id: string; input: ProductQuantityPricingInput }>({
    mutationFn: ({ id, input }) => updateProductQuantityPricing(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.quantityPricing(data.productId) });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.quantityPricingItem(data.id) });
    },
  });
}

export function useDeleteProductQuantityPricing() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; productId: string }>({
    mutationFn: ({ id }) => deleteProductQuantityPricing(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.quantityPricing(variables.productId) });
    },
  });
}
