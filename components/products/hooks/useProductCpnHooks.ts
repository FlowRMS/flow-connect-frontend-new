'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProductCpn, ProductCpnInput } from '../api';
import {
  fetchProductCpnById,
  listProductCpnsByProductId,
  createProductCpn,
  updateProductCpn,
  deleteProductCpn,
} from '../api';
import { productQueryKeys } from './queryKeys';

export function useProductCpn(id: string) {
  return useQuery<ProductCpn | null, Error>({
    queryKey: productQueryKeys.cpn(id),
    queryFn: () => fetchProductCpnById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useProductCpns(productId: string) {
  return useQuery<ProductCpn[], Error>({
    queryKey: productQueryKeys.cpns(productId),
    queryFn: () => listProductCpnsByProductId(productId),
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
}

export function useCreateProductCpn() {
  const queryClient = useQueryClient();

  return useMutation<ProductCpn, Error, ProductCpnInput>({
    mutationFn: createProductCpn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.cpns(data.productId) });
    },
  });
}

export function useUpdateProductCpn() {
  const queryClient = useQueryClient();

  return useMutation<ProductCpn, Error, { id: string; input: ProductCpnInput }>({
    mutationFn: ({ id, input }) => updateProductCpn(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.cpns(data.productId) });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.cpn(data.id) });
    },
  });
}

export function useDeleteProductCpn() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; productId: string }>({
    mutationFn: ({ id }) => deleteProductCpn(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.cpns(variables.productId) });
    },
  });
}
