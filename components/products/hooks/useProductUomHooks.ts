'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ProductUom,
  CreateProductUomInput,
  UpdateProductUomInput,
} from '../api';
import {
  fetchProductUoms,
  createProductUom,
  updateProductUom,
  deleteProductUom,
} from '../api';
import { productQueryKeys } from './queryKeys';

export function useProductUoms() {
  return useQuery<ProductUom[], Error>({
    queryKey: productQueryKeys.uoms(),
    queryFn: fetchProductUoms,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProductUom() {
  const queryClient = useQueryClient();

  return useMutation<ProductUom, Error, CreateProductUomInput>({
    mutationFn: createProductUom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.uoms() });
    },
  });
}

export function useUpdateProductUom() {
  const queryClient = useQueryClient();

  return useMutation<ProductUom, Error, { id: string; input: UpdateProductUomInput }>({
    mutationFn: ({ id, input }) => updateProductUom(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.uoms() });
    },
  });
}

export function useDeleteProductUom() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteProductUom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.uoms() });
    },
  });
}
