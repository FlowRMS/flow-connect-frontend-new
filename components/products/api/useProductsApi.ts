'use client';

/**
 * Products React Query Hooks
 * Custom hooks for interacting with the Products GraphQL API
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  // Types
  type Product,
  type ProductLandingPage,
  type ProductSearchResult,
  type ProductCategory,
  type ProductUom,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateProductCategoryInput,
  type UpdateProductCategoryInput,
  type CreateProductUomInput,
  type UpdateProductUomInput,
  type ProductLandingPageFilter,
  type ProductLandingPageOrderBy,
  type PaginatedProductsResult,
  type FactorySearchResult,
  type ProductCpn,
  type ProductCpnInput,
  type CustomerSearchResult,
  type ProductQuantityPricing,
  type ProductQuantityPricingInput,
  // API Functions
  fetchProductsWithPagination,
  fetchProductById,
  searchProductsApi,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchProductUoms,
  createProductUom,
  updateProductUom,
  deleteProductUom,
  fetchProductCategories,
  searchProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  searchFactories,
  // CPN API Functions
  fetchProductCpnById,
  listProductCpnsByProductId,
  createProductCpn,
  updateProductCpn,
  deleteProductCpn,
  searchCustomers,
  // Quantity Pricing API Functions
  fetchProductQuantityPricingById,
  listProductQuantityPricingByProductId,
  createProductQuantityPricing,
  updateProductQuantityPricing,
  deleteProductQuantityPricing,
} from './productsApi';

// ============================================================================
// Query Keys
// ============================================================================

export const productQueryKeys = {
  all: ['products'] as const,

  // Products
  products: () => [...productQueryKeys.all, 'list'] as const,
  productLandingPages: (filters?: ProductLandingPageFilter[], orderBy?: ProductLandingPageOrderBy) =>
    [...productQueryKeys.all, 'landingPages', { filters, orderBy }] as const,
  product: (id: string) => [...productQueryKeys.all, 'detail', id] as const,
  productSearch: (searchTerm?: string, factoryId?: string, categoryIds?: string[]) =>
    [...productQueryKeys.all, 'search', { searchTerm, factoryId, categoryIds }] as const,

  // UOMs
  uoms: () => [...productQueryKeys.all, 'uoms'] as const,

  // Categories
  categories: (factoryId?: string) => [...productQueryKeys.all, 'categories', { factoryId }] as const,
  categorySearch: (searchTerm: string, factoryId: string) =>
    [...productQueryKeys.all, 'categorySearch', { searchTerm, factoryId }] as const,

  // Factories
  factorySearch: (searchTerm: string) =>
    [...productQueryKeys.all, 'factorySearch', { searchTerm }] as const,

  // CPNs (Customer Part Numbers)
  cpns: (productId: string) => [...productQueryKeys.all, 'cpns', productId] as const,
  cpn: (id: string) => [...productQueryKeys.all, 'cpn', id] as const,

  // Customer Search
  customerSearch: (searchTerm: string) =>
    [...productQueryKeys.all, 'customerSearch', { searchTerm }] as const,

  // Quantity Pricing
  quantityPricing: (productId: string) => [...productQueryKeys.all, 'quantityPricing', productId] as const,
  quantityPricingItem: (id: string) => [...productQueryKeys.all, 'quantityPricingItem', id] as const,
};

// ============================================================================
// Product Hooks
// ============================================================================

const DEFAULT_PAGE_SIZE = 50;

/**
 * Fetch product landing pages with infinite scroll pagination
 */
export function useProductsInfinite(
  filters?: ProductLandingPageFilter[],
  orderBy?: ProductLandingPageOrderBy,
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

/**
 * Fetch product landing pages (non-paginated)
 */
export function useProducts(
  filters?: ProductLandingPageFilter[],
  orderBy?: ProductLandingPageOrderBy
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

/**
 * Fetch single product by ID
 */
export function useProduct(id: string) {
  return useQuery<Product | null, Error>({
    queryKey: productQueryKeys.product(id),
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Search products with debounce
 */
export function useProductSearch(
  searchTerm?: string,
  factoryId?: string,
  categoryIds?: string[],
  limit?: number
) {
  // Debounce the search term
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

/**
 * Create new product mutation
 */
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

/**
 * Update existing product mutation
 */
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

/**
 * Delete product mutation
 */
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

// ============================================================================
// Product UOM Hooks
// ============================================================================

/**
 * Fetch all product UOMs
 */
export function useProductUoms() {
  return useQuery<ProductUom[], Error>({
    queryKey: productQueryKeys.uoms(),
    queryFn: fetchProductUoms,
    staleTime: 5 * 60 * 1000, // 5 minutes - UOMs change rarely
  });
}

/**
 * Create new product UOM mutation
 */
export function useCreateProductUom() {
  const queryClient = useQueryClient();

  return useMutation<ProductUom, Error, CreateProductUomInput>({
    mutationFn: createProductUom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.uoms() });
    },
  });
}

/**
 * Update existing product UOM mutation
 */
export function useUpdateProductUom() {
  const queryClient = useQueryClient();

  return useMutation<ProductUom, Error, { id: string; input: UpdateProductUomInput }>({
    mutationFn: ({ id, input }) => updateProductUom(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.uoms() });
    },
  });
}

/**
 * Delete product UOM mutation
 */
export function useDeleteProductUom() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteProductUom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.uoms() });
    },
  });
}

// ============================================================================
// Product Category Hooks
// ============================================================================

/**
 * Fetch product categories
 * Fetches all categories when no factoryId is provided, or filtered by factoryId
 */
export function useProductCategories(factoryId?: string, parentId?: string, grandparentId?: string) {
  return useQuery<ProductCategory[], Error>({
    queryKey: productQueryKeys.categories(factoryId),
    queryFn: () => fetchProductCategories(factoryId, parentId, grandparentId),
    enabled: true, // Always enabled - fetch all categories or filtered by factoryId
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Search product categories
 * @param searchTerm - Search term for filtering categories
 * @param factoryId - Factory ID (optional, if not provided will fetch all categories)
 * @param limit - Maximum number of results
 */
export function useProductCategorySearch(searchTerm: string, factoryId?: string, limit?: number) {
  // If factoryId is provided, use the search endpoint
  // If not, use the list endpoint and filter client-side
  const hasFactoryId = !!factoryId;
  
  const searchQuery = useQuery<ProductCategory[], Error>({
    queryKey: productQueryKeys.categorySearch(searchTerm, factoryId!),
    queryFn: () => searchProductCategories(searchTerm, factoryId!, limit),
    enabled: hasFactoryId && !!searchTerm,
    staleTime: 30 * 1000,
  });

  const allCategoriesQuery = useProductCategories(factoryId);
  
  // If no factoryId, use all categories and filter client-side
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

/**
 * Create new product category mutation
 */
export function useCreateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation<ProductCategory, Error, CreateProductCategoryInput>({
    mutationFn: createProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.categories() });
    },
  });
}

/**
 * Update existing product category mutation
 */
export function useUpdateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation<ProductCategory, Error, { id: string; input: UpdateProductCategoryInput }>({
    mutationFn: ({ id, input }) => updateProductCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.categories() });
    },
  });
}

/**
 * Delete product category mutation
 */
export function useDeleteProductCategory() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.categories() });
    },
  });
}

// ============================================================================
// Factory Search Hook
// ============================================================================

/**
 * Search factories for product creation
 * When searchTerm is empty, returns initial factory list
 */
export function useFactorySearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<FactorySearchResult[], Error>({
    queryKey: productQueryKeys.factorySearch(searchTerm || ''),
    queryFn: () => searchFactories(searchTerm || '', true), // Only published factories
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Product CPN (Customer Part Number) Hooks
// ============================================================================

/**
 * Fetch a single CPN by ID
 */
export function useProductCpn(id: string) {
  return useQuery<ProductCpn | null, Error>({
    queryKey: productQueryKeys.cpn(id),
    queryFn: () => fetchProductCpnById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * List all CPNs for a product
 */
export function useProductCpns(productId: string) {
  return useQuery<ProductCpn[], Error>({
    queryKey: productQueryKeys.cpns(productId),
    queryFn: () => listProductCpnsByProductId(productId),
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create new product CPN mutation
 */
export function useCreateProductCpn() {
  const queryClient = useQueryClient();

  return useMutation<ProductCpn, Error, ProductCpnInput>({
    mutationFn: createProductCpn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.cpns(data.productId) });
    },
  });
}

/**
 * Update existing product CPN mutation
 */
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

/**
 * Delete product CPN mutation
 */
export function useDeleteProductCpn() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; productId: string }>({
    mutationFn: ({ id }) => deleteProductCpn(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.cpns(variables.productId) });
    },
  });
}

// ============================================================================
// Customer Search Hook (for CPN customer selection)
// ============================================================================

/**
 * Search customers for CPN creation
 * When searchTerm is empty, returns initial customer list
 */
export function useCustomerSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<CustomerSearchResult[], Error>({
    queryKey: productQueryKeys.customerSearch(searchTerm || ''),
    queryFn: () => searchCustomers(searchTerm || '', true), // Only published customers
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Product Quantity Pricing Hooks
// ============================================================================

/**
 * Fetch a single quantity pricing tier by ID
 */
export function useProductQuantityPricing(id: string) {
  return useQuery<ProductQuantityPricing | null, Error>({
    queryKey: productQueryKeys.quantityPricingItem(id),
    queryFn: () => fetchProductQuantityPricingById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * List all quantity pricing tiers for a product
 */
export function useProductQuantityPricingList(productId: string) {
  return useQuery<ProductQuantityPricing[], Error>({
    queryKey: productQueryKeys.quantityPricing(productId),
    queryFn: () => listProductQuantityPricingByProductId(productId),
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create new product quantity pricing tier mutation
 */
export function useCreateProductQuantityPricing() {
  const queryClient = useQueryClient();

  return useMutation<ProductQuantityPricing, Error, ProductQuantityPricingInput>({
    mutationFn: createProductQuantityPricing,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.quantityPricing(data.productId) });
    },
  });
}

/**
 * Update existing product quantity pricing tier mutation
 */
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

/**
 * Delete product quantity pricing tier mutation
 */
export function useDeleteProductQuantityPricing() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; productId: string }>({
    mutationFn: ({ id }) => deleteProductQuantityPricing(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.quantityPricing(variables.productId) });
    },
  });
}

// Re-export types for convenience
export type {
  Product,
  ProductLandingPage,
  ProductSearchResult,
  ProductCategory,
  ProductUom,
  CreateProductInput,
  UpdateProductInput,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
  CreateProductUomInput,
  UpdateProductUomInput,
  ProductLandingPageFilter,
  ProductLandingPageOrderBy,
  PaginatedProductsResult,
  FactorySearchResult,
  ProductCpn,
  ProductCpnInput,
  CustomerSearchResult,
  ProductQuantityPricing,
  ProductQuantityPricingInput,
};
