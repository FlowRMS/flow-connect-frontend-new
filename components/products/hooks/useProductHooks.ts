'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type {
  Product,
  ProductLandingPage,
  ProductSearchResult,
  CreateProductInput,
  UpdateProductInput,
  ProductLandingPageFilter,
  ProductLandingPageOrderBy,
  PaginatedProductsResult,
} from '../api';
import {
  fetchProductsWithPagination,
  fetchProductById,
  searchProductsApi,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api';
import { productQueryKeys } from './queryKeys';

const DEFAULT_PAGE_SIZE = 50;

export function useProductsInfinite(
  filters?: ProductLandingPageFilter[],
  orderBy?: ProductLandingPageOrderBy[],
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedProductsResult, Error>({
    queryKey: [...productQueryKeys.productLandingPages(filters, orderBy), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchProductsWithPagination(filters, orderBy, {
        limit: pageSize,
        offset: pageParam as number
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.records.length, 0);
      if (totalFetched >= lastPage.total) return undefined;
      return totalFetched;
    },
    enabled: true,
    staleTime: 30 * 1000,
  });
}

export function useProducts(
  filters?: ProductLandingPageFilter[],
  orderBy?: ProductLandingPageOrderBy[]
) {
  return useQuery<ProductLandingPage[], Error>({
    queryKey: productQueryKeys.productLandingPages(filters, orderBy),
    queryFn: async () => {
      const result = await fetchProductsWithPagination(filters, orderBy, { limit: 1000, offset: 0 });
      return result.records;
    },
    enabled: true,
    staleTime: 30 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery<Product | null, Error>({
    queryKey: productQueryKeys.product(id),
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useProductSearch(
  searchTerm?: string,
  factoryId?: string,
  categoryIds?: string[],
  limit?: number
) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return useQuery<ProductSearchResult[], Error>({
    queryKey: productQueryKeys.productSearch(debouncedTerm, factoryId, categoryIds),
    queryFn: () => searchProductsApi(debouncedTerm, factoryId, categoryIds, limit),
    enabled: !!debouncedTerm && debouncedTerm.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, CreateProductInput>({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.products() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, { id: string; input: UpdateProductInput }>({
    mutationFn: ({ id, input }) => updateProduct(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.products() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.product(data.id) });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.products() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
    },
  });
}
