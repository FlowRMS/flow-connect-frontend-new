/**
 * Takeoffs Document Processing Functions
 * Classification, abridgement, and product cross operations
 */

import { flowAIGraphQLRequest } from '../flow-ai-client';
import {
  CLASSIFY_DOCUMENT,
  ABRIDGE_DOCUMENT,
  CROSS_PRODUCTS,
  PRODUCT_CROSS_FROM_PARSED_DOCUMENT,
} from './queries';
import type {
  ClassificationResult,
  AbridgementResult,
  ProductCrossType,
  ParsedProductCross,
  ParsedItem,
} from './types';

/**
 * Classify a document using AI
 */
export async function classifyDocument(
  documentUrl: string,
  filename: string
): Promise<ClassificationResult> {
  const response = await flowAIGraphQLRequest<{ classifyDocument: ClassificationResult }>({
    query: CLASSIFY_DOCUMENT,
    variables: { documentUrl, filename },
  });

  if (response.errors) {
    return {
      success: false,
      category: null,
      confidence: null,
      reasoning: null,
      documentType: null,
      error: response.errors[0]?.message || 'Failed to classify document',
    };
  }

  return response.data?.classifyDocument || {
    success: false,
    category: null,
    confidence: null,
    reasoning: null,
    documentType: null,
    error: 'No response from server',
  };
}

/**
 * Abridge a document using AI - extracts relevant pages
 */
export async function abridgeDocument(
  documentUrl: string,
  filename: string,
  instructions: string[] = ['Extract relevant product and fixture information']
): Promise<AbridgementResult> {
  const response = await flowAIGraphQLRequest<{ abridgeDocument: AbridgementResult }>({
    query: ABRIDGE_DOCUMENT,
    variables: { documentUrl, filename, instructions },
  });

  if (response.errors) {
    return {
      success: false,
      abridgedUrl: null,
      originalPages: null,
      abridgedPages: null,
      reductionPercentage: null,
      pageAnalyses: null,
      error: response.errors[0]?.message || 'Failed to abridge document',
      wasAbridged: false,
    };
  }

  return response.data?.abridgeDocument || {
    success: false,
    abridgedUrl: null,
    originalPages: null,
    abridgedPages: null,
    reductionPercentage: null,
    pageAnalyses: null,
    error: 'No response from server',
    wasAbridged: false,
  };
}

/**
 * Cross products with alternatives
 */
export async function crossProducts(
  products: Record<string, unknown>[],
  crossTypes: ProductCrossType[] = ['SIMPLE'],
  samplePrompts?: string[]
): Promise<ParsedProductCross[]> {
  const response = await flowAIGraphQLRequest<{ crossProducts: ParsedProductCross[] }>({
    query: CROSS_PRODUCTS,
    variables: { products, crossTypes, samplePrompts },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to cross products');
  }

  return response.data?.crossProducts || [];
}

/**
 * Cross products from a parsed document
 */
export async function productCrossFromParsedDocument(
  documentUrl: string,
  filename: string,
  crossTypes: ProductCrossType[] = ['SIMPLE'],
  samplePrompts?: string[]
): Promise<ParsedProductCross[]> {
  const response = await flowAIGraphQLRequest<{ productCrossFromParsedDocument: ParsedProductCross[] }>({
    query: PRODUCT_CROSS_FROM_PARSED_DOCUMENT,
    variables: { documentUrl, filename, crossTypes, samplePrompts },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to cross products from document');
  }

  return response.data?.productCrossFromParsedDocument || [];
}

/**
 * Parse schedule document to extract product items
 * Uses productCrossFromParsedDocument API and extracts only the parsed items
 * @param documentUrl - URL of the document to parse
 * @param filename - Original filename
 * @param documentId - Optional ID of the source document for backend persistence
 */
export async function parseScheduleDocument(
  documentUrl: string,
  filename: string,
  documentId?: string
): Promise<ParsedItem[]> {
  // Use the product cross API to parse the document
  const results = await productCrossFromParsedDocument(documentUrl, filename, ['SIMPLE']);

  // Extract parsed items from the results
  const parsedItems: ParsedItem[] = results.map((result, index) => {
    // Parse the original field - it may come as a JSON string from the API
    let original: Record<string, unknown>;
    if (typeof result.original === 'string') {
      try {
        original = JSON.parse(result.original);
      } catch {
        console.warn('[parseScheduleDocument] Failed to parse original:', result.original);
        original = {};
      }
    } else {
      original = result.original as Record<string, unknown>;
    }

    // Extract fields - API returns different field names depending on document type
    const manufacturer = (original.manufacturer as string)
      || (original.Manufacturer as string)
      || (original.mark as string)
      || (original.name as string)
      || 'Unknown';

    const partNumber = (original.part_number as string)
      || (original.partNumber as string)
      || (original.PartNumber as string)
      || (original.model as string)
      || (original.mark as string)
      || '';

    const description = (original.description as string)
      || (original.Description as string)
      || (original.type as string)
      || '';

    return {
      id: `parsed-${index}-${Date.now()}`,
      documentId,
      manufacturer,
      partNumber,
      description,
      quantity: (original.quantity as number) || (original.Quantity as number) || 1,
      isOurManufacturer: false,
      isCrossed: false,
    };
  });

  return parsedItems;
}
