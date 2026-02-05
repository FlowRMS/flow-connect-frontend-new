import { crmGraphQLRequest } from '../../../lib/crm-graphql';
import type {
  ProductUom,
  CreateProductUomInput,
  UpdateProductUomInput,
} from '../types/productTypes';
import { PRODUCT_UOMS } from '../queries/productQueries';
import {
  CREATE_PRODUCT_UOM,
  UPDATE_PRODUCT_UOM,
  DELETE_PRODUCT_UOM,
} from '../mutations/productMutations';

export async function fetchProductUoms(): Promise<ProductUom[]> {
  const response = await crmGraphQLRequest<{ productUoms: ProductUom[] }>({
    query: PRODUCT_UOMS,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product UOMs');
  }

  return response.data?.productUoms || [];
}

export async function createProductUom(input: CreateProductUomInput): Promise<ProductUom> {
  const response = await crmGraphQLRequest<{ createProductUom: ProductUom }>({
    query: CREATE_PRODUCT_UOM,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product UOM');
  }

  if (!response.data?.createProductUom) {
    throw new Error('No UOM returned from create mutation');
  }

  return response.data.createProductUom;
}

export async function updateProductUom(id: string, input: UpdateProductUomInput): Promise<ProductUom> {
  const response = await crmGraphQLRequest<{ updateProductUom: ProductUom }>({
    query: UPDATE_PRODUCT_UOM,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product UOM');
  }

  if (!response.data?.updateProductUom) {
    throw new Error('No UOM returned from update mutation');
  }

  return response.data.updateProductUom;
}

export async function deleteProductUom(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProductUom: string }>({
    query: DELETE_PRODUCT_UOM,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product UOM');
  }

  return true;
}
