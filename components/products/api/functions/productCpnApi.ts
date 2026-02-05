import { crmGraphQLRequest } from '../../../lib/crm-graphql';
import type { ProductCpn, ProductCpnInput } from '../types/productTypes';
import {
  FIND_PRODUCT_CPN_BY_ID,
  LIST_PRODUCT_CPNS_BY_PRODUCT_ID,
} from '../queries/productQueries';
import {
  CREATE_PRODUCT_CPN,
  UPDATE_PRODUCT_CPN,
  DELETE_PRODUCT_CPN,
} from '../mutations/productMutations';

export async function fetchProductCpnById(id: string): Promise<ProductCpn | null> {
  const response = await crmGraphQLRequest<{ findProductCpnById: ProductCpn }>({
    query: FIND_PRODUCT_CPN_BY_ID,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product CPN');
  }

  return response.data?.findProductCpnById || null;
}

export async function listProductCpnsByProductId(productId: string): Promise<ProductCpn[]> {
  const response = await crmGraphQLRequest<{ listProductCpnsByProductId: ProductCpn[] }>({
    query: LIST_PRODUCT_CPNS_BY_PRODUCT_ID,
    variables: { productId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch product CPNs');
  }

  return response.data?.listProductCpnsByProductId || [];
}

export async function createProductCpn(input: ProductCpnInput): Promise<ProductCpn> {
  const response = await crmGraphQLRequest<{ createProductCpn: ProductCpn }>({
    query: CREATE_PRODUCT_CPN,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create product CPN');
  }

  if (!response.data?.createProductCpn) {
    throw new Error('No CPN returned from create mutation');
  }

  return response.data.createProductCpn;
}

export async function updateProductCpn(id: string, input: ProductCpnInput): Promise<ProductCpn> {
  const response = await crmGraphQLRequest<{ updateProductCpn: ProductCpn }>({
    query: UPDATE_PRODUCT_CPN,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update product CPN');
  }

  if (!response.data?.updateProductCpn) {
    throw new Error('No CPN returned from update mutation');
  }

  return response.data.updateProductCpn;
}

export async function deleteProductCpn(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteProductCpn: boolean }>({
    query: DELETE_PRODUCT_CPN,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product CPN');
  }

  return true;
}
