/**
 * Product Crosses GraphQL Module
 * GraphQL queries and API functions for Product Crosses (AI-powered product alternatives)
 * Also includes CRUD operations for managing known product cross-references in the database
 */

import { flowAIGraphQLRequest } from './flow-ai-client';

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

// ============================================================================
// Database Product Crosses Types
// ============================================================================

export interface KnownProductCross {
  id: string;
  userId: string;
  competitorManufacturer: string;
  competitorPartNumber: string;
  competitorDescription: string | null;
  ourManufacturer: string;
  ourPartNumber: string;
  ourDescription: string | null;
  timesUsed: number;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnownProductCrossListResult {
  crosses: KnownProductCross[];
  totalCount: number;
}

export interface CreateKnownProductCrossInput {
  competitorManufacturer: string;
  competitorPartNumber: string;
  competitorDescription?: string | null;
  ourManufacturer: string;
  ourPartNumber: string;
  ourDescription?: string | null;
}

export interface UpdateKnownProductCrossInput {
  competitorManufacturer?: string | null;
  competitorPartNumber?: string | null;
  competitorDescription?: string | null;
  ourManufacturer?: string | null;
  ourPartNumber?: string | null;
  ourDescription?: string | null;
}

export interface BulkKnownProductCrossInput {
  competitorManufacturer: string;
  competitorPartNumber: string;
  competitorDescription?: string | null;
  ourManufacturer: string;
  ourPartNumber: string;
  ourDescription?: string | null;
  timesUsed?: number;
}

export interface KnownProductCrossFilters {
  limit?: number;
  offset?: number;
  search?: string;
  competitorManufacturer?: string;
  competitorPartNumber?: string;
  ourManufacturer?: string;
  ourPartNumber?: string;
  usageLevel?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

// ============================================================================
// Database Product Crosses GraphQL Queries
// ============================================================================

const GET_KNOWN_PRODUCT_CROSS = `
  query GetProductCross($productCrossId: UUID!) {
    getProductCross(productCrossId: $productCrossId) {
      id
      userId
      competitorManufacturer
      competitorPartNumber
      competitorDescription
      ourManufacturer
      ourPartNumber
      ourDescription
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

const GET_KNOWN_PRODUCT_CROSSES = `
  query GetProductCrosses(
    $limit: Int,
    $offset: Int,
    $search: String,
    $competitorManufacturer: String,
    $competitorPartNumber: String,
    $ourManufacturer: String,
    $ourPartNumber: String,
    $usageLevel: String,
    $dateFrom: datetime,
    $dateTo: datetime,
    $sortBy: String,
    $sortOrder: String
  ) {
    getProductCrosses(
      limit: $limit,
      offset: $offset,
      search: $search,
      competitorManufacturer: $competitorManufacturer,
      competitorPartNumber: $competitorPartNumber,
      ourManufacturer: $ourManufacturer,
      ourPartNumber: $ourPartNumber,
      usageLevel: $usageLevel,
      dateFrom: $dateFrom,
      dateTo: $dateTo,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      id
      userId
      competitorManufacturer
      competitorPartNumber
      competitorDescription
      ourManufacturer
      ourPartNumber
      ourDescription
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

const GET_KNOWN_PRODUCT_CROSSES_PAGINATED = `
  query GetProductCrossesPaginated(
    $limit: Int,
    $offset: Int,
    $search: String,
    $competitorManufacturer: String,
    $competitorPartNumber: String,
    $ourManufacturer: String,
    $ourPartNumber: String,
    $usageLevel: String,
    $dateFrom: datetime,
    $dateTo: datetime,
    $sortBy: String,
    $sortOrder: String
  ) {
    getProductCrossesPaginated(
      limit: $limit,
      offset: $offset,
      search: $search,
      competitorManufacturer: $competitorManufacturer,
      competitorPartNumber: $competitorPartNumber,
      ourManufacturer: $ourManufacturer,
      ourPartNumber: $ourPartNumber,
      usageLevel: $usageLevel,
      dateFrom: $dateFrom,
      dateTo: $dateTo,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      totalCount
      crosses {
        id
        userId
        competitorManufacturer
        competitorPartNumber
        competitorDescription
        ourManufacturer
        ourPartNumber
        ourDescription
        timesUsed
        lastUsed
        createdAt
        updatedAt
      }
    }
  }
`;

// ============================================================================
// Database Product Crosses GraphQL Mutations
// ============================================================================

const CREATE_KNOWN_PRODUCT_CROSS = `
  mutation CreateProductCross($input: CreateProductCrossInput!) {
    createProductCross(input: $input) {
      id
      userId
      competitorManufacturer
      competitorPartNumber
      competitorDescription
      ourManufacturer
      ourPartNumber
      ourDescription
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_KNOWN_PRODUCT_CROSS = `
  mutation UpdateProductCross($productCrossId: UUID!, $input: UpdateProductCrossInput!) {
    updateProductCross(productCrossId: $productCrossId, input: $input) {
      id
      userId
      competitorManufacturer
      competitorPartNumber
      competitorDescription
      ourManufacturer
      ourPartNumber
      ourDescription
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

const DELETE_KNOWN_PRODUCT_CROSS = `
  mutation DeleteProductCross($productCrossId: UUID!) {
    deleteProductCross(productCrossId: $productCrossId)
  }
`;

const INCREMENT_KNOWN_PRODUCT_CROSS_USAGE = `
  mutation IncrementProductCrossUsage($productCrossId: UUID!) {
    incrementProductCrossUsage(productCrossId: $productCrossId) {
      id
      timesUsed
      lastUsed
    }
  }
`;

const BULK_CREATE_KNOWN_PRODUCT_CROSSES = `
  mutation BulkCreateProductCrosses($crosses: [BulkProductCrossInput!]!) {
    bulkCreateProductCrosses(crosses: $crosses) {
      id
      userId
      competitorManufacturer
      competitorPartNumber
      competitorDescription
      ourManufacturer
      ourPartNumber
      ourDescription
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

// ============================================================================
// Database Product Crosses API Functions - Queries
// ============================================================================

/**
 * Get a single known product cross by ID
 */
export async function getKnownProductCross(productCrossId: string): Promise<KnownProductCross | null> {
  const response = await flowAIGraphQLRequest<{ getProductCross: KnownProductCross | null }>({
    query: GET_KNOWN_PRODUCT_CROSS,
    variables: { productCrossId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get product cross');
  }

  return response.data?.getProductCross || null;
}

/**
 * Get known product crosses with filtering and pagination
 */
export async function getKnownProductCrosses(
  filters: KnownProductCrossFilters = {}
): Promise<KnownProductCross[]> {
  const response = await flowAIGraphQLRequest<{ getProductCrosses: KnownProductCross[] }>({
    query: GET_KNOWN_PRODUCT_CROSSES,
    variables: filters,
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get product crosses');
  }

  return response.data?.getProductCrosses || [];
}

/**
 * Get known product crosses with total count for pagination
 */
export async function getKnownProductCrossesPaginated(
  filters: KnownProductCrossFilters = {}
): Promise<KnownProductCrossListResult> {
  const response = await flowAIGraphQLRequest<{ getProductCrossesPaginated: KnownProductCrossListResult }>({
    query: GET_KNOWN_PRODUCT_CROSSES_PAGINATED,
    variables: filters,
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get product crosses');
  }

  return response.data?.getProductCrossesPaginated || { crosses: [], totalCount: 0 };
}

// ============================================================================
// Database Product Crosses API Functions - Mutations
// ============================================================================

/**
 * Create a new known product cross
 */
export async function createKnownProductCross(
  input: CreateKnownProductCrossInput
): Promise<KnownProductCross> {
  const response = await flowAIGraphQLRequest<{ createProductCross: KnownProductCross }>({
    query: CREATE_KNOWN_PRODUCT_CROSS,
    variables: { input },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to create product cross');
  }

  if (!response.data?.createProductCross) {
    throw new Error('Failed to create product cross');
  }

  return response.data.createProductCross;
}

/**
 * Update an existing known product cross
 */
export async function updateKnownProductCross(
  productCrossId: string,
  input: UpdateKnownProductCrossInput
): Promise<KnownProductCross> {
  const response = await flowAIGraphQLRequest<{ updateProductCross: KnownProductCross }>({
    query: UPDATE_KNOWN_PRODUCT_CROSS,
    variables: { productCrossId, input },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to update product cross');
  }

  if (!response.data?.updateProductCross) {
    throw new Error('Failed to update product cross');
  }

  return response.data.updateProductCross;
}

/**
 * Delete a known product cross
 */
export async function deleteKnownProductCross(productCrossId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deleteProductCross: boolean }>({
    query: DELETE_KNOWN_PRODUCT_CROSS,
    variables: { productCrossId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to delete product cross');
  }

  return response.data?.deleteProductCross || false;
}

/**
 * Increment usage count for a known product cross
 */
export async function incrementKnownProductCrossUsage(
  productCrossId: string
): Promise<KnownProductCross> {
  const response = await flowAIGraphQLRequest<{ incrementProductCrossUsage: KnownProductCross }>({
    query: INCREMENT_KNOWN_PRODUCT_CROSS_USAGE,
    variables: { productCrossId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to increment usage');
  }

  if (!response.data?.incrementProductCrossUsage) {
    throw new Error('Failed to increment usage');
  }

  return response.data.incrementProductCrossUsage;
}

/**
 * Bulk create known product crosses
 */
export async function bulkCreateKnownProductCrosses(
  crosses: BulkKnownProductCrossInput[]
): Promise<KnownProductCross[]> {
  const response = await flowAIGraphQLRequest<{ bulkCreateProductCrosses: KnownProductCross[] }>({
    query: BULK_CREATE_KNOWN_PRODUCT_CROSSES,
    variables: { crosses },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to bulk create product crosses');
  }

  return response.data?.bulkCreateProductCrosses || [];
}
