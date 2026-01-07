// Entity Matching Types - Aligned with GraphQL API

// API Entity Types
export type PendingEntityType = 'FACTORIES' | 'CUSTOMERS' | 'BILL_TO_CUSTOMERS' | 'PRODUCTS' | 'END_USERS' | 'ORDERS' | 'INVOICES';

// API Status Types
export type ConfirmationStatus =
  | 'PENDING_REVIEW'
  | 'AUTO_MATCHED'
  | 'CONFIRMED'
  | 'CREATED_NEW'
  | 'REJECTED'
  | 'NEEDS_REVIEW'
  | 'EMPTY_NAME'
  | 'SET_FOR_CREATION'
  | 'SKIPPED';

// Bulk Confirm Action Types
export type BulkConfirmAction = 'MATCH_EXISTING' | 'CREATE_NEW' | 'REJECT' | 'SKIP' | 'SET_FOR_CREATION';

// Match Candidate from API
export interface MatchCandidate {
  entityId: string;
  metadata: string | null;
  name: string;
  rank: number;
  similarityScore: number | string; // API may return as string
}

// Pending Entity from API
export interface PendingEntity {
  id: string;
  bestMatchId: string | null;
  bestMatchName: string | null;
  bestMatchSimilarity: number | string | null; // API may return as string
  confirmationStatus: ConfirmationStatus;
  confirmedByUserId: string | null;
  confirmedAt: string | null;
  createdAt: string;
  displayName: string;
  dtoIds: string[] | null;
  entityType: PendingEntityType;
  extractedData: string | null; // JSON string
  flowIndexDetail: string | null; // JSON string with flow index details
  matchCandidates: MatchCandidate[];
  pendingDocumentId: string;
  sourceLineNumbers: number[] | null;
  updatedAt: string;
  // UI-specific state
  selected?: boolean;
  originalIndex?: number; // Used for stable sorting
}

// Search result entity
export interface SearchEntity {
  entityId: string;
  metadata: string | null;
  name: string;
  rank: number;
  similarityScore: number;
}

// Filter input for pendingEntities query
export interface PendingEntitiesFilterInput {
  entityType: PendingEntityType;
  pendingDocumentId: string;
  status?: ConfirmationStatus;
}

// Input for searchExistingEntities query
export interface SearchExistingEntitiesInput {
  entityType: PendingEntityType;
  query: string;
  limit?: number;
}

// Input for confirmEntityMatch mutation
export interface ConfirmEntityMatchInput {
  pendingEntityId: string;
  existingEntityId: string;
  existingEntityName: string; // Name of the matched entity
}

// Input for bulkConfirmEntities mutation
export interface BulkConfirmEntityInput {
  pendingEntityId: string;
  action: BulkConfirmAction;
  existingEntityId?: string;
  existingEntityName?: string; // Name of the matched entity (required for MATCH_EXISTING)
  fieldOverrides?: string; // JSON string
  flowIndex?: number; // Integer from flowIndexDetail
}

// Subscription progress data
export interface ProcessExtractedDtosProgress {
  currentBatch: number;
  entityPendingType: PendingEntityType;
  percentage: number;
  processed: number;
  total: number;
  totalBatches: number;
}

// UI Step navigation types
export type EntityStep = 'factories' | 'customers' | 'billtocustomers' | 'endusers' | 'products' | 'orders' | 'invoices';

// Map from step to API entity type
export const stepToEntityType: Record<EntityStep, PendingEntityType> = {
  factories: 'FACTORIES',
  customers: 'CUSTOMERS',
  billtocustomers: 'BILL_TO_CUSTOMERS',
  endusers: 'END_USERS',
  products: 'PRODUCTS',
  orders: 'ORDERS',
  invoices: 'INVOICES',
};

// Map from API entity type to step
export const entityTypeToStep: Record<PendingEntityType, EntityStep> = {
  FACTORIES: 'factories',
  CUSTOMERS: 'customers',
  BILL_TO_CUSTOMERS: 'billtocustomers',
  END_USERS: 'endusers',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  INVOICES: 'invoices',
};

// Filter types for UI
export type FilterType = 'auto-matched' | 'needs-review' | 'pending' | 'confirmed' | 'no-match' | 'skipped' | 'set-for-creation';

// Map confirmation status to filter type
export const statusToFilterType: Record<ConfirmationStatus, FilterType> = {
  AUTO_MATCHED: 'auto-matched',
  NEEDS_REVIEW: 'needs-review',
  PENDING_REVIEW: 'pending',
  CONFIRMED: 'confirmed',
  CREATED_NEW: 'confirmed',
  REJECTED: 'no-match',
  EMPTY_NAME: 'needs-review',
  SET_FOR_CREATION: 'set-for-creation',
  SKIPPED: 'skipped',
};

// Step status for navigation UI
export interface StepStatus {
  validated: boolean;
  needsReview: number;
  total: number;
}

// Helper function to get confidence percentage from similarity score
export function getConfidencePercentage(similarity: number | string | null): number {
  if (similarity === null || similarity === undefined) return 0;
  const numValue = typeof similarity === 'string' ? parseFloat(similarity) : similarity;
  if (isNaN(numValue)) return 0;
  return Math.round(numValue * 100);
}

// Helper function to determine if entity needs action
export function needsAction(status: ConfirmationStatus): boolean {
  return status === 'PENDING_REVIEW' || status === 'NEEDS_REVIEW';
}

// Helper function to check if entity is resolved (no longer needs action)
// AUTO_MATCHED is considered resolved as it has a valid match that can be auto-approved
export function isResolved(status: ConfirmationStatus): boolean {
  return status === 'CONFIRMED' || status === 'CREATED_NEW' || status === 'REJECTED' || status === 'AUTO_MATCHED' || status === 'SKIPPED' || status === 'SET_FOR_CREATION';
}

// Parse extracted data JSON
export function parseExtractedData(extractedData: string | null): Record<string, unknown> | null {
  if (!extractedData) return null;
  try {
    return JSON.parse(extractedData);
  } catch {
    return null;
  }
}

// Legacy type aliases for backward compatibility during transition
export type EntityType = 'factory' | 'customer' | 'enduser' | 'product';

// Legacy EntityMatch interface for reference (deprecated - use PendingEntity)
export interface EntityMatch {
  id: string;
  spreadsheetName: string;
  spreadsheetData: {
    address?: string;
    lines: number[];
    rawValue?: string;
  };
  matchType: 'id' | 'perfect' | 'ai';
  confidence: number;
  reasoning: string;
  pastConfirmations: number;
  suggestedMatch: {
    id: string;
    name: string;
  };
  alternativeMatches?: Array<{
    id: string;
    name: string;
    confidence: number;
  }>;
  status: 'auto' | 'confirmed' | 'needs-review' | 'user-created' | 'no-match';
  selected?: boolean;
}

// Convert PendingEntity to legacy EntityMatch format (for gradual migration)
export function pendingEntityToEntityMatch(entity: PendingEntity): EntityMatch {
  const extractedData = parseExtractedData(entity.extractedData);
  const bestMatch = entity.matchCandidates.find(m => m.entityId === entity.bestMatchId);

  // Map confirmation status to legacy status
  const statusMap: Record<ConfirmationStatus, EntityMatch['status']> = {
    AUTO_MATCHED: 'auto',
    CONFIRMED: 'confirmed',
    CREATED_NEW: 'user-created',
    NEEDS_REVIEW: 'needs-review',
    PENDING_REVIEW: 'needs-review',
    REJECTED: 'no-match',
    EMPTY_NAME: 'needs-review',
    SET_FOR_CREATION: 'user-created',
    SKIPPED: 'no-match',
  };

  return {
    id: entity.id,
    spreadsheetName: entity.displayName,
    spreadsheetData: {
      address: extractedData?.address as string | undefined,
      lines: entity.sourceLineNumbers || [],
      rawValue: extractedData?.rawValue as string | undefined,
    },
    matchType: entity.bestMatchSimilarity && Number(entity.bestMatchSimilarity) >= 0.95 ? 'perfect' : 'ai',
    confidence: getConfidencePercentage(entity.bestMatchSimilarity),
    reasoning: bestMatch ? `Matched with ${Math.round((Number(bestMatch.similarityScore) || 0) * 100)}% similarity` : 'No match found',
    pastConfirmations: 0, // Not available in API
    suggestedMatch: bestMatch
      ? { id: bestMatch.entityId, name: bestMatch.name }
      : { id: '', name: '' },
    alternativeMatches: entity.matchCandidates
      .filter(m => m.entityId !== entity.bestMatchId)
      .slice(0, 4)
      .map(m => ({
        id: m.entityId,
        name: m.name,
        confidence: Math.round((Number(m.similarityScore) || 0) * 100),
      })),
    status: statusMap[entity.confirmationStatus] || 'needs-review',
    selected: entity.selected,
  };
}




