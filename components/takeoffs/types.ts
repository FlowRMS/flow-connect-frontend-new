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

// Map step to API status (for updating takeoff status when step changes)
export const stepToApiStatus: Partial<Record<TakeoffStep, TakeoffStatusEnum>> = {
  classification: 'CLASSIFICATION',
  abridgment: 'ABRIDGMENT',
  parsing: 'PARSING',
  productCross: 'COMPLETE',
  approvals: 'COMPLETE',
  // 'review' has no corresponding status
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

// Document discipline types
export type DocumentDiscipline =
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC'
  | 'Fire Protection'
  | 'Lighting'
  | 'General'
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

// Priority type for takeoffs
export type TakeoffPriority = 'Low' | 'Medium' | 'High';

// Takeoff metadata type
export interface TakeoffMetadata {
  clientName?: string;
  bidDate?: string;
  estimatedValue?: string;
  city?: string;
  state?: string;
  [key: string]: unknown;
}

// Main Take-off type (UI display format)
export interface Takeoff {
  id: string;
  takeoffNumber: string;
  title: string;
  source: string;
  createdBy: string;
  createdDate: string;
  status: TakeoffStatus;
  priority?: TakeoffPriority;
  quoteId?: string;
  userId?: string;
  metadata?: TakeoffMetadata;
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
  discipline?: DocumentDiscipline;
  confidence: number;
  pages: number;
  abridged: boolean;
  abridgedPages?: number;
  reductionPercentage?: number;
  documentUrl?: string;
  abridgedUrl?: string;
  pageAnalyses?: PageAnalysis[];
  products?: unknown;
  parsedItems?: ParsedItem[];
  fileHash?: string; // For duplicate detection
}

// Parsed item from schedule
export interface ParsedItem {
  id: string;
  documentId?: string; // Track which document this item came from for backend persistence
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
 * Transform API metadata response to UI metadata format
 * Handles different possible metadata formats from the backend
 */
function transformMetadata(metadata: Record<string, unknown> | null | undefined): TakeoffMetadata | undefined {
  if (!metadata || Object.keys(metadata).length === 0) {
    return undefined;
  }

  // Explicitly extract known fields, handling various possible key formats
  const clientName = (metadata.clientName ?? metadata.client_name ?? metadata.ClientName) as string | undefined;
  const bidDate = (metadata.bidDate ?? metadata.bid_date ?? metadata.BidDate) as string | undefined;
  const estimatedValue = (metadata.estimatedValue ?? metadata.estimated_value ?? metadata.EstimatedValue) as string | undefined;
  const city = (metadata.city ?? metadata.City) as string | undefined;
  const state = (metadata.state ?? metadata.State) as string | undefined;

  // Return metadata with properly typed fields
  return {
    clientName: clientName || undefined,
    bidDate: bidDate || undefined,
    estimatedValue: estimatedValue || undefined,
    city: city || undefined,
    state: state || undefined,
    // Preserve any additional fields from the backend
    ...metadata,
  };
}

/**
 * Transform API response to UI display format
 */
export function transformTakeoffResponse(response: TakeoffResponse): Takeoff {
  return {
    id: response.id,
    takeoffNumber: response.takeoffNumber,
    title: response.title,
    source: response.source,
    createdBy: response.createdBy,
    createdDate: response.createdAt,
    status: statusDisplayMap[response.status],
    quoteId: response.quoteId || undefined,
    userId: response.userId,
    metadata: transformMetadata(response.metadata),
    documents: response.documents?.map(transformDocumentResponse),
  };
}

/**
 * Safely parse parsedItems which may come as array, JSON string, or null
 */
function safeParseParsedItems(parsedItems: unknown): ParsedItem[] | undefined {
  if (!parsedItems) return undefined;

  // If it's already an array, transform it
  if (Array.isArray(parsedItems)) {
    return parsedItems.map(transformParsedItem);
  }

  // If it's a string, try to parse it as JSON
  if (typeof parsedItems === 'string') {
    try {
      const parsed = JSON.parse(parsedItems);
      if (Array.isArray(parsed)) {
        return parsed.map(transformParsedItem);
      }
    } catch {
      console.warn('Failed to parse parsedItems string:', parsedItems);
    }
  }

  return undefined;
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
    abridgedUrl: doc.abridgedUrl || undefined,
    pageAnalyses: doc.pageAnalyses || undefined,
    products: doc.products,
    parsedItems: safeParseParsedItems(doc.parsedItems),
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
