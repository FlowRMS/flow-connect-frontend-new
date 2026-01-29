import { crmGraphQLRequest } from '../../../lib/crm-graphql';
import type {
  ProductQuantityPricing,
  ProductQuantityPricingInput,
} from '../types/productTypes';
import {
  FIND_PRODUCT_QUANTITY_PRICING_BY_ID,
  LIST_PRODUCT_QUANTITY_PRICING_BY_PRODUCT_ID,
} from '../queries/productQueries';
import {
  CREATE_PRODUCT_QUANTITY_PRICING,
  UPDATE_PRODUCT_QUANTITY_PRICING,
  DELETE_PRODUCT_QUANTITY_PRICING,
} from '../mutations/productMutations';

export async function fetchProductQuantityPricingById(id: string): Promise<ProductQuantityPricing | null> {
  const response = await crmGraphQLRequest<{ findProductQuantityPricingById: ProductQuantityPricing }>({
    query: FIND_PRODUCT_QUANTITY_PRICING_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product quantity pricing');
  }

  return response.data?.findProductQuantityPricingById || null;
}

export async function listProductQuantityPricingByProductId(productId: string): Promise<ProductQuantityPricing[]> {
  const response = await crmGraphQLRequest<{ listProductQuantityPricingByProductId: ProductQuantityPricing[] }>({
    query: LIST_PRODUCT_QUANTITY_PRICING_BY_PRODUCT_ID,
    variables: { productId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product quantity pricing');
  }

  return response.data?.listProductQuantityPricingByProductId || [];
}

export async function createProductQuantityPricing(input: ProductQuantityPricingInput): Promise<ProductQuantityPricing> {
  const response = await crmGraphQLRequest<{ createProductQuantityPricing: ProductQuantityPricing }>({
    query: CREATE_PRODUCT_QUANTITY_PRICING,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product quantity pricing');
  }

  if (!response.data?.createProductQuantityPricing) {
    throw new Error('No quantity pricing returned from create mutation');
  }

  return response.data.createProductQuantityPricing;
}

export async function updateProductQuantityPricing(
  id: string,
  input: ProductQuantityPricingInput
): Promise<ProductQuantityPricing> {
  const response = await crmGraphQLRequest<{ updateProductQuantityPricing: ProductQuantityPricing }>({
    query: UPDATE_PRODUCT_QUANTITY_PRICING,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product quantity pricing');
  }

  if (!response.data?.updateProductQuantityPricing) {
    throw new Error('No quantity pricing returned from update mutation');
  }

  return response.data.updateProductQuantityPricing;
}

export async function deleteProductQuantityPricing(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProductQuantityPricing: boolean }>({
    query: DELETE_PRODUCT_QUANTITY_PRICING,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product quantity pricing');
  }

  return true;
}
