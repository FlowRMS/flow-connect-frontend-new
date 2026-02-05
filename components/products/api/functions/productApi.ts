import { crmGraphQLRequest } from '../../../lib/crm-graphql';
import type {
  Product,
  ProductLandingPage,
  ProductSearchResult,
  CreateProductInput,
  UpdateProductInput,
  ProductLandingPageFilter,
  ProductLandingPageOrderBy,
  PaginationParams,
  PaginatedProductsResult,
} from '../types/productTypes';
import {
  FIND_PRODUCT_BY_ID,
  PRODUCT_SEARCH,
  PRODUCT_LANDING_PAGES,
} from '../queries/productQueries';
import {
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
} from '../mutations/productMutations';

export async function fetchProductsWithPagination(
  filters?: ProductLandingPageFilter[],
  orderBy?: ProductLandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedProductsResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: ProductLandingPage[]; total: number };
  }>({
    query: PRODUCT_LANDING_PAGES,
    variables: {
      filters,
      orderBy,
      limit: pagination?.limit ?? 50,
      offset: pagination?.offset ?? 0,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch products');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}

export async function fetchProducts(): Promise<ProductLandingPage[]> {
  const result = await fetchProductsWithPagination();
  return result.records;
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const response = await crmGraphQLRequest<{ product: Product }>({
    query: FIND_PRODUCT_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product');
  }

  return response.data?.product || null;
}

export async function searchProductsApi(
  searchTerm?: string,
  _factoryId?: string,
  _productCategoryIds?: string[],
  limit?: number
): Promise<ProductSearchResult[]> {
  const response = await crmGraphQLRequest<{ productSearch: ProductSearchResult[] }>({
    query: PRODUCT_SEARCH,
    variables: {
      searchTerm: searchTerm || '',
      limit: limit ?? 50,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search products');
  }

  return response.data?.productSearch || [];
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const response = await crmGraphQLRequest<{ createProduct: Product }>({
    query: CREATE_PRODUCT,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product');
  }

  if (!response.data?.createProduct) {
    throw new Error('No product returned from create mutation');
  }

  return response.data.createProduct;
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const response = await crmGraphQLRequest<{ updateProduct: Product }>({
    query: UPDATE_PRODUCT,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product');
  }

  if (!response.data?.updateProduct) {
    throw new Error('No product returned from update mutation');
  }

  return response.data.updateProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProduct: string }>({
    query: DELETE_PRODUCT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product');
  }

  return true;
}

export async function fetchAllProductIds(
  filters?: ProductLandingPageFilter[],
  orderBy?: ProductLandingPageOrderBy[]
): Promise<string[]> {
  const initialResult = await fetchProductsWithPagination(filters, orderBy, { limit: 1, offset: 0 });
  const total = initialResult.total;

  if (total === 0) return [];

  const batchSize = 500;
  const allIds: string[] = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const result = await fetchProductsWithPagination(filters, orderBy, { limit: batchSize, offset });
    allIds.push(...result.records.map(r => r.id));
  }

  return allIds;
}
