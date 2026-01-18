/**
 * AI Product Cross Functions
 * Functions for AI-powered product cross operations
 */

import { flowAIGraphQLRequest } from '../flow-ai-client';
import { CROSS_PRODUCTS, CROSS_PRODUCTS_FROM_DOCUMENT } from './queries';
import type { ProductCrossTypeEnum, ParsedProductCross } from './types';

/**
 * Cross products using AI to find alternatives
 * @param products - Array of product objects with properties like manufacturer, model, etc.
 * @param crossTypes - Types of crosses to find (SIMPLE, VALUE, UPGRADE)
 * @param samplePrompts - Optional custom prompts to guide the AI
 */
export async function crossProducts(
  products: Record<string, unknown>[],
  crossTypes: ProductCrossTypeEnum[],
  samplePrompts?: string[]
): Promise<ParsedProductCross[]> {
  const response = await flowAIGraphQLRequest<{ crossProducts: ParsedProductCross[] }>({
    query: CROSS_PRODUCTS,
    variables: {
      products,
      crossTypes,
      samplePrompts: samplePrompts || null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to cross products');
  }

  return response.data?.crossProducts || [];
}

/**
 * Cross products from a parsed document
 * @param documentUrl - URL of the document (presigned S3 URL or data URL)
 * @param filename - Original filename
 * @param crossTypes - Types of crosses to find (SIMPLE, VALUE, UPGRADE)
 * @param samplePrompts - Optional custom prompts to guide the AI
 */
export async function crossProductsFromDocument(
  documentUrl: string,
  filename: string,
  crossTypes: ProductCrossTypeEnum[],
  samplePrompts?: string[]
): Promise<ParsedProductCross[]> {
  const response = await flowAIGraphQLRequest<{
    productCrossFromParsedDocument: ParsedProductCross[];
  }>({
    query: CROSS_PRODUCTS_FROM_DOCUMENT,
    variables: {
      documentUrl,
      filename,
      crossTypes,
      samplePrompts: samplePrompts || null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to cross products from document');
  }

  return response.data?.productCrossFromParsedDocument || [];
}
