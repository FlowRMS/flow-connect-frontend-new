'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ProductCategory,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '../api';
import {
  fetchProductCategories,
  searchProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../api';
import { productQueryKeys } from './queryKeys';

export function useProductCategories(factoryId?: string, parentId?: string, grandparentId?: string) {
  return useQuery<ProductCategory[], Error>({
    queryKey: productQueryKeys.categories(factoryId),
    queryFn: () => fetchProductCategories(factoryId, parentId, grandparentId),
    enabled: true,
    staleTime: 2 * 60 * 1000,
  });
}

export function useProductCategorySearch(searchTerm: string, factoryId?: string, limit?: number) {
  const hasFactoryId = !!factoryId;

  const searchQuery = useQuery<ProductCategory[], Error>({
    queryKey: productQueryKeys.categorySearch(searchTerm, factoryId!),
    queryFn: () => searchProductCategories(searchTerm, factoryId!, limit),
    enabled: hasFactoryId && !!searchTerm,
    staleTime: 30 * 1000,
  });

  const allCategoriesQuery = useProductCategories(factoryId);

  if (!hasFactoryId) {
    const filteredCategories = (allCategoriesQuery.data || []).filter(category =>
      category.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, limit);

    return {
      ...allCategoriesQuery,
      data: filteredCategories,
    };
  }

  return searchQuery;
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation<ProductCategory, Error, CreateProductCategoryInput>({
    mutationFn: createProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.categories() });
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation<ProductCategory, Error, { id: string; input: UpdateProductCategoryInput }>({
    mutationFn: ({ id, input }) => updateProductCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.categories() });
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.categories() });
    },
  });
}
