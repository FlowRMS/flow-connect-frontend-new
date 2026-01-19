/**
 * Product Crosses Types
 * Type definitions for product crosses module
 */

// ============================================================================
// AI Product Cross Types
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
// UI Display Types
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

// ============================================================================
// Known Product Cross Types (Database)
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
// Cross Prompt Template Types
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
