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
  attributes: Record<string, string> | null;
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
          attributes
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
          attributes
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
 * Parse the original field which may come as a JSON string from the API
 */
function parseOriginal(original: unknown): Record<string, unknown> {
  if (typeof original === 'string') {
    try {
      return JSON.parse(original);
    } catch {
      console.warn('[product-crosses] Failed to parse original:', original);
      return {};
    }
  }
  return (original as Record<string, unknown>) || {};
}

/**
 * Transform API results to display format for the Product Crosses table
 */
export function transformResultsToDisplayItems(
  results: ParsedProductCross[]
): ProductCrossDisplayItem[] {
  const displayItems: ProductCrossDisplayItem[] = [];

  for (const result of results) {
    // Parse the original field - it may come as a JSON string from the API
    const original = parseOriginal(result.original);

    for (const cross of result.crosses) {
      for (const alt of cross.alternatives) {
        displayItems.push({
          id: crypto.randomUUID(),
          // API returns different fields: manufacturer/mark for name, part_number/mark for part, description/type for desc
          competitorManufacturer: extractValue(original, ['manufacturer', 'brand', 'vendor', 'mark', 'name']),
          competitorPartNumber: extractValue(original, ['partNumber', 'part_number', 'model', 'sku', 'mark']),
          competitorDescription: cross.originalProduct || extractValue(original, ['description', 'type']),
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
  [key: string]: string | number | undefined;
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
  try {
    const response = await flowAIGraphQLRequest<{ createProductCross: KnownProductCross }>({
      query: CREATE_KNOWN_PRODUCT_CROSS,
      variables: { input },
    });
    if (response.errors) {
      console.error('🔵 [createKnownProductCross] GraphQL errors:', response.errors);
      throw new Error(response.errors[0]?.message || 'Failed to create product cross');
    }

    if (!response.data?.createProductCross) {
      console.error('🔵 [createKnownProductCross] No data returned');
      throw new Error('Failed to create product cross');
    }
    return response.data.createProductCross;
  } catch (error) {
    console.error('🔵 [createKnownProductCross] EXCEPTION caught:', error);
    throw error;
  }
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
    console.error('🔴 [updateKnownProductCross] GraphQL errors:', JSON.stringify(response.errors, null, 2));
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

// ============================================================================
// Cross Prompt Templates Types
// ============================================================================

export interface CrossPromptTemplate {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  description: string | null;
  timesUsed: number;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrossPromptTemplateListResult {
  templates: CrossPromptTemplate[];
  totalCount: number;
}

export interface CreateCrossPromptTemplateInput {
  name: string;
  prompt: string;
  description?: string | null;
}

export interface UpdateCrossPromptTemplateInput {
  name?: string | null;
  prompt?: string | null;
  description?: string | null;
}

// ============================================================================
// Cross Prompt Templates GraphQL Queries
// ============================================================================

const GET_CROSS_PROMPT_TEMPLATE = `
  query GetCrossPromptTemplate($templateId: UUID!) {
    getCrossPromptTemplate(templateId: $templateId) {
      id
      userId
      name
      prompt
      description
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

const GET_CROSS_PROMPT_TEMPLATES = `
  query GetCrossPromptTemplates(
    $limit: Int,
    $offset: Int,
    $search: String,
    $sortBy: String,
    $sortOrder: String
  ) {
    getCrossPromptTemplates(
      limit: $limit,
      offset: $offset,
      search: $search,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      id
      userId
      name
      prompt
      description
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

const GET_CROSS_PROMPT_TEMPLATES_PAGINATED = `
  query GetCrossPromptTemplatesPaginated(
    $limit: Int,
    $offset: Int,
    $search: String,
    $sortBy: String,
    $sortOrder: String
  ) {
    getCrossPromptTemplatesPaginated(
      limit: $limit,
      offset: $offset,
      search: $search,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      totalCount
      templates {
        id
        userId
        name
        prompt
        description
        timesUsed
        lastUsed
        createdAt
        updatedAt
      }
    }
  }
`;

// ============================================================================
// Cross Prompt Templates GraphQL Mutations
// ============================================================================

const CREATE_CROSS_PROMPT_TEMPLATE = `
  mutation CreateCrossPromptTemplate($input: CreateCrossPromptTemplateInput!) {
    createCrossPromptTemplate(input: $input) {
      id
      userId
      name
      prompt
      description
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_CROSS_PROMPT_TEMPLATE = `
  mutation UpdateCrossPromptTemplate($templateId: UUID!, $input: UpdateCrossPromptTemplateInput!) {
    updateCrossPromptTemplate(templateId: $templateId, input: $input) {
      id
      userId
      name
      prompt
      description
      timesUsed
      lastUsed
      createdAt
      updatedAt
    }
  }
`;

const DELETE_CROSS_PROMPT_TEMPLATE = `
  mutation DeleteCrossPromptTemplate($templateId: UUID!) {
    deleteCrossPromptTemplate(templateId: $templateId)
  }
`;

const INCREMENT_CROSS_PROMPT_TEMPLATE_USAGE = `
  mutation IncrementCrossPromptTemplateUsage($templateId: UUID!) {
    incrementCrossPromptTemplateUsage(templateId: $templateId) {
      id
      timesUsed
      lastUsed
    }
  }
`;

// ============================================================================
// Cross Prompt Templates API Functions - Queries
// ============================================================================

/**
 * Get a single prompt template by ID
 */
export async function getCrossPromptTemplate(templateId: string): Promise<CrossPromptTemplate | null> {
  const response = await flowAIGraphQLRequest<{ getCrossPromptTemplate: CrossPromptTemplate | null }>({
    query: GET_CROSS_PROMPT_TEMPLATE,
    variables: { templateId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get prompt template');
  }

  return response.data?.getCrossPromptTemplate || null;
}

/**
 * Get prompt templates with filtering and pagination
 */
export async function getCrossPromptTemplates(
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}
): Promise<CrossPromptTemplate[]> {
  const response = await flowAIGraphQLRequest<{ getCrossPromptTemplates: CrossPromptTemplate[] }>({
    query: GET_CROSS_PROMPT_TEMPLATES,
    variables: options,
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get prompt templates');
  }

  return response.data?.getCrossPromptTemplates || [];
}

/**
 * Get prompt templates with total count for pagination
 */
export async function getCrossPromptTemplatesPaginated(
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}
): Promise<CrossPromptTemplateListResult> {
  const response = await flowAIGraphQLRequest<{ getCrossPromptTemplatesPaginated: CrossPromptTemplateListResult }>({
    query: GET_CROSS_PROMPT_TEMPLATES_PAGINATED,
    variables: options,
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get prompt templates');
  }

  return response.data?.getCrossPromptTemplatesPaginated || { templates: [], totalCount: 0 };
}

// ============================================================================
// Cross Prompt Templates API Functions - Mutations
// ============================================================================

/**
 * Create a new prompt template
 */
export async function createCrossPromptTemplate(
  input: CreateCrossPromptTemplateInput
): Promise<CrossPromptTemplate> {
  const response = await flowAIGraphQLRequest<{ createCrossPromptTemplate: CrossPromptTemplate }>({
    query: CREATE_CROSS_PROMPT_TEMPLATE,
    variables: { input },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to create prompt template');
  }

  if (!response.data?.createCrossPromptTemplate) {
    throw new Error('Failed to create prompt template');
  }

  return response.data.createCrossPromptTemplate;
}

/**
 * Update an existing prompt template
 */
export async function updateCrossPromptTemplate(
  templateId: string,
  input: UpdateCrossPromptTemplateInput
): Promise<CrossPromptTemplate> {
  const response = await flowAIGraphQLRequest<{ updateCrossPromptTemplate: CrossPromptTemplate }>({
    query: UPDATE_CROSS_PROMPT_TEMPLATE,
    variables: { templateId, input },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to update prompt template');
  }

  if (!response.data?.updateCrossPromptTemplate) {
    throw new Error('Failed to update prompt template');
  }

  return response.data.updateCrossPromptTemplate;
}

/**
 * Delete a prompt template
 */
export async function deleteCrossPromptTemplate(templateId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deleteCrossPromptTemplate: boolean }>({
    query: DELETE_CROSS_PROMPT_TEMPLATE,
    variables: { templateId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to delete prompt template');
  }

  return response.data?.deleteCrossPromptTemplate || false;
}

/**
 * Increment usage count for a prompt template
 */
export async function incrementCrossPromptTemplateUsage(
  templateId: string
): Promise<CrossPromptTemplate> {
  const response = await flowAIGraphQLRequest<{ incrementCrossPromptTemplateUsage: CrossPromptTemplate }>({
    query: INCREMENT_CROSS_PROMPT_TEMPLATE_USAGE,
    variables: { templateId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to increment usage');
  }

  if (!response.data?.incrementCrossPromptTemplateUsage) {
    throw new Error('Failed to increment usage');
  }

  return response.data.incrementCrossPromptTemplateUsage;
}
