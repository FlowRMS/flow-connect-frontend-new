/**
 * Take-Off Types and Interfaces
 */

import type {
  TakeoffStatusEnum,
  TakeoffResponse,
  TakeoffDocumentResponse,
  PageAnalysis,
  ParsedItem as APIParsedItem,
} from '@/components/lib/graphql/takeoffs';

// Re-export API types for convenience
export type { TakeoffStatusEnum, TakeoffResponse, TakeoffDocumentResponse, PageAnalysis };

// ============================================================================
// Status Types
// ============================================================================

// Take-off status types (display format)
export type TakeoffStatus = 'Classification' | 'Abridgment' | 'Parsing' | 'Complete';

// Map API status to display status
export const statusDisplayMap: Record<TakeoffStatusEnum, TakeoffStatus> = {
  CLASSIFICATION: 'Classification',
  ABRIDGMENT: 'Abridgment',
  PARSING: 'Parsing',
  COMPLETE: 'Complete',
};

// Map display status to API status
export const statusApiMap: Record<TakeoffStatus, TakeoffStatusEnum> = {
  Classification: 'CLASSIFICATION',
  Abridgment: 'ABRIDGMENT',
  Parsing: 'PARSING',
  Complete: 'COMPLETE',
};

// ============================================================================
// Document Types
// ============================================================================

// Document classification types
export type DocumentClassification =
  | 'Fixture Schedules'
  | 'Specifications'
  | 'Blueprints'
  | 'Other Docs'
  | 'Irrelevant'
  | '';

// View mode types
export type TakeoffViewMode = 'list' | 'detail';

// Step types for the detail flow (6-step workflow)
export type TakeoffStep =
  | 'review'        // Review Documents
  | 'classification' // Classification
  | 'abridgment'    // Create Abridged
  | 'parsing'       // Schedule Parsing
  | 'productCross'  // Product Cross
  | 'approvals';    // Approvals

// ============================================================================
// Main Types (for UI display)
// ============================================================================

// Main Take-off type (UI display format)
export interface Takeoff {
  id: string;
  title: string;
  source: string;
  createdBy: string;
  createdDate: string;
  status: TakeoffStatus;
  quoteId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  documents?: TakeoffDocument[];
}

// Document type for uploaded files (UI display format)
export interface TakeoffDocument {
  id: string;
  name: string;
  type: 'PDF';
  size: string;
  uploadDate: string;
  classification: DocumentClassification;
  confidence: number;
  pages: number;
  abridged: boolean;
  abridgedPages?: number;
  reductionPercentage?: number;
  documentUrl?: string;
  pageAnalyses?: PageAnalysis[];
  products?: unknown;
  parsedItems?: ParsedItem[];
}

// Parsed item from schedule
export interface ParsedItem {
  id: string;
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
// Transform Functions
// ============================================================================

/**
 * Transform API response to UI display format
 */
export function transformTakeoffResponse(response: TakeoffResponse): Takeoff {
  return {
    id: response.id,
    title: response.title,
    source: response.source,
    createdBy: response.createdBy,
    createdDate: response.createdAt,
    status: statusDisplayMap[response.status],
    quoteId: response.quoteId || undefined,
    userId: response.userId,
    metadata: response.metadata || undefined,
    documents: response.documents?.map(transformDocumentResponse),
  };
}

/**
 * Transform API document response to UI display format
 */
export function transformDocumentResponse(doc: TakeoffDocumentResponse): TakeoffDocument {
  return {
    id: doc.id,
    name: doc.name,
    type: 'PDF',
    size: doc.fileSize,
    uploadDate: doc.createdAt,
    classification: mapClassification(doc.classification),
    confidence: doc.confidence || 0,
    pages: doc.pages,
    abridged: doc.abridged,
    abridgedPages: doc.abridgedPages || undefined,
    reductionPercentage: doc.reductionPercentage || undefined,
    documentUrl: doc.documentUrl || undefined,
    pageAnalyses: doc.pageAnalyses || undefined,
    products: doc.products,
    parsedItems: doc.parsedItems?.map(transformParsedItem),
  };
}

/**
 * Map backend classification to UI classification
 */
function mapClassification(classification: string | null): DocumentClassification {
  if (!classification) return '';

  const classificationMap: Record<string, DocumentClassification> = {
    fixture_schedules: 'Fixture Schedules',
    specifications: 'Specifications',
    blueprints: 'Blueprints',
    other: 'Other Docs',
    irrelevant: 'Irrelevant',
    // Handle already-formatted values
    'Fixture Schedules': 'Fixture Schedules',
    Specifications: 'Specifications',
    Blueprints: 'Blueprints',
    'Other Docs': 'Other Docs',
    Irrelevant: 'Irrelevant',
  };

  return classificationMap[classification] || 'Other Docs';
}

/**
 * Transform API parsed item to UI format
 */
function transformParsedItem(item: APIParsedItem): ParsedItem {
  return {
    id: item.id || crypto.randomUUID(),
    manufacturer: item.manufacturer,
    partNumber: item.partNumber,
    description: item.description,
    quantity: item.quantity,
    isOurManufacturer: item.isOurManufacturer || false,
    isCrossed: item.isCrossed || false,
    crossedManufacturer: item.crossedManufacturer,
    crossedPartNumber: item.crossedPartNumber,
    crossedDescription: item.crossedDescription,
  };
}

// ============================================================================
// UI Configuration Types
// ============================================================================

// Abridgment report item
export interface AbridgmentReportItem {
  page: number;
  included: boolean;
  reason: string;
}

// Filter options for take-offs
export interface TakeoffFilterOption {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'date';
  columnName?: string;
  options?: string[];
}

// Document category tab
export interface DocumentCategory {
  id: DocumentClassification;
  label: string;
  count: number;
}

// Step configuration for the multi-step flow
export interface StepConfig {
  id: TakeoffStep;
  label: string;
  icon: string;
}
