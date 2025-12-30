/**
 * Product Crosses GraphQL Module
 * GraphQL queries and API functions for Product Crosses (AI-powered product alternatives)
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type ProductCrossTypeEnum = 'SIMPLE' | 'VALUE' | 'UPGRADE';

export interface ProductAlternative {
  name: string;
  description: string | null;
  price: number | null;
  source: string | null;
  crossType: ProductCrossTypeEnum;
}

export interface ProductCrossResult {
  crossType: ProductCrossTypeEnum;
  originalProduct: string;
  alternatives: ProductAlternative[];
  promptUsed: string;
  notes: string | null;
}

export interface ParsedProductCross {
  original: Record<string, unknown>;
  crosses: ProductCrossResult[];
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const CROSS_PRODUCTS = `
  query CrossProducts(
    $products: [JSON!]!
    $crossTypes: [ProductCrossTypeEnum!]!
    $samplePrompts: [String!]
  ) {
    crossProducts(
      products: $products
      crossTypes: $crossTypes
      samplePrompts: $samplePrompts
    ) {
      original
      crosses {
        crossType
        originalProduct
        alternatives {
          name
          description
          price
          source
          crossType
        }
        promptUsed
        notes
      }
    }
  }
`;

const CROSS_PRODUCTS_FROM_DOCUMENT = `
  query ProductCrossFromParsedDocument(
    $documentUrl: String!
    $filename: String!
    $crossTypes: [ProductCrossTypeEnum!]!
    $samplePrompts: [String!]
  ) {
    productCrossFromParsedDocument(
      documentUrl: $documentUrl
      filename: $filename
      crossTypes: $crossTypes
      samplePrompts: $samplePrompts
    ) {
      original
      crosses {
        crossType
        originalProduct
        alternatives {
          name
          description
          price
          source
          crossType
        }
        promptUsed
        notes
      }
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

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
  const response = await crmGraphQLRequest<{ crossProducts: ParsedProductCross[] }>({
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
  const response = await crmGraphQLRequest<{
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

// ============================================================================
// Helper Types for UI Display
// ============================================================================

export interface ProductCrossDisplayItem {
  id: string;
  competitorManufacturer: string;
  competitorPartNumber: string;
  competitorDescription: string;
  ourManufacturer: string;
  ourPartNumber: string;
  ourDescription: string;
  timesUsed: number;
  lastUsed: string;
  crossType: ProductCrossTypeEnum;
  confidence: number;
  price?: number;
}

/**
 * Transform API results to display format for the Product Crosses table
 */
export function transformResultsToDisplayItems(
  results: ParsedProductCross[]
): ProductCrossDisplayItem[] {
  const displayItems: ProductCrossDisplayItem[] = [];

  for (const result of results) {
    const original = result.original;

    for (const cross of result.crosses) {
      for (const alt of cross.alternatives) {
        displayItems.push({
          id: crypto.randomUUID(),
          competitorManufacturer: extractValue(original, ['manufacturer', 'brand', 'vendor']),
          competitorPartNumber: extractValue(original, ['partNumber', 'part_number', 'model', 'sku']),
          competitorDescription: cross.originalProduct,
          ourManufacturer: alt.source || 'FlowRMS',
          ourPartNumber: extractPartNumber(alt.name),
          ourDescription: alt.description || alt.name,
          timesUsed: 0,
          lastUsed: new Date().toISOString(),
          crossType: alt.crossType,
          confidence: alt.price ? 85 : 70,
          price: alt.price || undefined,
        });
      }
    }
  }

  return displayItems;
}

/**
 * Extract a value from an object using multiple possible keys
 */
function extractValue(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (value && typeof value === 'string') {
      return value;
    }
  }
  return '';
}

/**
 * Extract part number from product name
 */
function extractPartNumber(name: string): string {
  // Try to extract a part number pattern from the name
  const match = name.match(/[A-Z0-9]+-?[A-Z0-9]+/i);
  return match ? match[0] : name.split(' ')[0] || '';
}
