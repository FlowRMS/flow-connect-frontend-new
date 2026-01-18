/**
 * Takeoffs GraphQL Types
 * Type definitions for takeoffs module
 */

// ============================================================================
// Core Types
// ============================================================================

export type TakeoffStatusEnum = 'CLASSIFICATION' | 'ABRIDGMENT' | 'PARSING' | 'COMPLETE';

export interface TakeoffDocumentResponse {
  id: string;
  takeoffId: string;
  fileId: string;
  name: string;
  fileType: string;
  fileSize: number;
  documentUrl: string | null;
  classification: string | null;
  confidence: number | null;
  pages: number;
  abridged: boolean;
  abridgedPages: number | null;
  abridgedUrl: string | null;
  reductionPercentage: number | null;
  pageAnalyses: PageAnalysis[] | null;
  products: unknown;
  parsedItems: ParsedItem[] | null;
  createdAt: string;
}

export interface TakeoffResponse {
  id: string;
  takeoffNumber: string;
  title: string;
  source: string;
  createdById: string;
  status: TakeoffStatusEnum;
  quoteId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  documents: TakeoffDocumentResponse[];
}

export interface PageAnalysis {
  pageNumber: number;
  isRelevant: boolean;
  confidence: number;
  reasoning: string;
  mainTopic: string;
}

export interface ParsedItem {
  id: string;
  documentId?: string;
  manufacturer: string;
  partNumber: string;
  description: string;
  quantity: number;
  isOurManufacturer: boolean;
  isCrossed: boolean;
  crossedManufacturer?: string;
  crossedPartNumber?: string;
  crossedDescription?: string;
}

// ============================================================================
// Input Types
// ============================================================================

export interface TakeoffDocumentInput {
  fileId: string;
  classification?: string | null;
  confidence?: number | null;
  pages?: number;
  abridged?: boolean;
  abridgedPages?: number | null;
  reductionPercentage?: number | null;
  pageAnalyses?: PageAnalysis[] | null;
  products?: unknown;
  parsedItems?: ParsedItem[] | null;
}

export interface CreateTakeoffInput {
  title: string;
  source?: string;
  status?: TakeoffStatusEnum;
  quoteId?: string | null;
  metadata?: Record<string, unknown> | null;
  documents?: TakeoffDocumentInput[] | null;
}

export interface UpdateTakeoffInput {
  title?: string | null;
  source?: string | null;
  status?: TakeoffStatusEnum | null;
  quoteId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateTakeoffDocumentInput {
  classification?: string | null;
  confidence?: number | null;
  discipline?: string | null;
  pages?: number | null;
  abridged?: boolean | null;
  abridgedPages?: number | null;
  abridgedUrl?: string | null;
  reductionPercentage?: number | null;
  pageAnalyses?: PageAnalysis[] | null;
  products?: unknown;
  parsedItems?: ParsedItem[] | null;
}

// ============================================================================
// Document Processing Types
// ============================================================================

export interface ClassificationResult {
  success: boolean;
  category: string | null;
  confidence: number | null;
  reasoning: string | null;
  documentType: string | null;
  error: string | null;
}

export interface AbridgementPageAnalysis {
  pageNumber: number;
  isRelevant: boolean;
  confidence: number;
  reasoning: string;
  mainTopic: string;
}

export interface AbridgementResult {
  success: boolean;
  abridgedUrl: string | null;
  originalPages: number | null;
  abridgedPages: number | null;
  reductionPercentage: number | null;
  pageAnalyses: AbridgementPageAnalysis[] | null;
  error: string | null;
  wasAbridged: boolean;
}

export type ProductCrossType = 'SIMPLE' | 'VALUE' | 'UPGRADE';

export interface ProductAlternative {
  name: string;
  description: string | null;
  price: number | null;
  source: string | null;
  crossType: ProductCrossType;
}

export interface ProductCrossResult {
  crossType: ProductCrossType;
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
// Fetch Parameters
// ============================================================================

export interface FetchTakeoffsParams {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  title?: string;
}

export interface TakeoffsPaginatedResult {
  takeoffs: TakeoffResponse[];
  totalCount: number;
}

// ============================================================================
// Upload Types
// ============================================================================

export interface UploadProgressCallback {
  (fileIndex: number, progress: number, status: 'uploading' | 'complete' | 'error', error?: string): void;
}

export interface CreateTakeoffWithFilesInput {
  title: string;
  source?: string;
  metadata?: {
    clientName?: string;
    bidDate?: string;
    estimatedValue?: string;
    city?: string;
    state?: string;
  };
  files: File[];
}

export interface UploadedFileInfo {
  file: File;
  crmFile: import('../files').FileResponse;
  presignedUrl: string;
}

export interface TakeoffUploadResponse {
  fileId: string;
  s3Key: string;
  presignedUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

// ============================================================================
// Product Cross Persistence Types
// ============================================================================

export interface ProductCrossAlternative {
  name: string;
  description: string;
  price?: number | null;
  source?: string | null;
  crossType: 'SIMPLE' | 'UPGRADE' | 'VALUE';
  attributes?: Record<string, string> | null;
  reasoning?: string | null;
  selected?: boolean;
}

export interface SaveProductCrossInput {
  takeoffId: string;
  originalManufacturer: string;
  originalPartNumber: string;
  originalDescription?: string | null;
  originalAttributes?: Record<string, string> | null;
  alternatives: ProductCrossAlternative[];
  crossTypesUsed?: ('SIMPLE' | 'UPGRADE' | 'VALUE')[] | null;
  promptUsed?: string | null;
}

export interface TakeoffProductCrossResponse {
  id: string;
  takeoffId: string;
  originalManufacturer: string;
  originalPartNumber: string;
  originalDescription?: string | null;
  originalAttributes?: Record<string, string> | null;
  alternatives: ProductCrossAlternative[];
  crossTypesUsed?: string[] | null;
  promptUsed?: string | null;
  createdAt: string;
}

// ============================================================================
// Prompt Template Types
// ============================================================================

export interface PromptTemplateResponse {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
