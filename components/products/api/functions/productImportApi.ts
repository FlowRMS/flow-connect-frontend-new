import { crmGraphQLRequest } from '../../../lib/crm-graphql';
import type { ProductImportInput, ProductImportResult } from '../types/productTypes';
import { IMPORT_PRODUCTS } from '../mutations/productMutations';

export async function importProducts(
  input: ProductImportInput,
  defaultUomId: string
): Promise<ProductImportResult> {
  const response = await crmGraphQLRequest<{ importProducts: ProductImportResult }>({
    query: IMPORT_PRODUCTS,
    variables: { input, defaultUomId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to import products');
  }

  if (!response.data?.importProducts) {
    throw new Error('No result returned from import mutation');
  }

  return response.data.importProducts;
}
