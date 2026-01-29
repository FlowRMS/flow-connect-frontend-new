import { crmGraphQLRequest } from '../../../lib/crm-graphql';
import type {
  ProductCategory,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '../types/productTypes';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_SEARCH,
} from '../queries/productQueries';
import {
  CREATE_PRODUCT_CATEGORY,
  UPDATE_PRODUCT_CATEGORY,
  DELETE_PRODUCT_CATEGORY,
} from '../mutations/productMutations';

export async function fetchProductCategories(
  factoryId?: string,
  parentId?: string,
  grandparentId?: string
): Promise<ProductCategory[]> {
  const response = await crmGraphQLRequest<{ productCategories: ProductCategory[] }>({
    query: PRODUCT_CATEGORIES,
    variables: { factoryId, parentId, grandparentId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product categories');
  }

  return response.data?.productCategories || [];
}

export async function searchProductCategories(
  searchTerm: string,
  factoryId: string,
  limit?: number
): Promise<ProductCategory[]> {
  const response = await crmGraphQLRequest<{ productCategorySearch: ProductCategory[] }>({
    query: PRODUCT_CATEGORY_SEARCH,
    variables: { searchTerm, factoryId, limit: limit ?? 20 },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search product categories');
  }

  return response.data?.productCategorySearch || [];
}

export async function createProductCategory(input: CreateProductCategoryInput): Promise<ProductCategory> {
  const response = await crmGraphQLRequest<{ createProductCategory: ProductCategory }>({
    query: CREATE_PRODUCT_CATEGORY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product category');
  }

  if (!response.data?.createProductCategory) {
    throw new Error('No category returned from create mutation');
  }

  return response.data.createProductCategory;
}

export async function updateProductCategory(
  id: string,
  input: UpdateProductCategoryInput
): Promise<ProductCategory> {
  const response = await crmGraphQLRequest<{ updateProductCategory: ProductCategory }>({
    query: UPDATE_PRODUCT_CATEGORY,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product category');
  }

  if (!response.data?.updateProductCategory) {
    throw new Error('No category returned from update mutation');
  }

  return response.data.updateProductCategory;
}

export async function deleteProductCategory(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProductCategory: string }>({
    query: DELETE_PRODUCT_CATEGORY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product category');
  }

  return true;
}
