/**
 * Takeoffs GraphQL Module
 * GraphQL queries and API functions for Takeoffs
 * Uses flow-ai backend for AI-powered document processing
 */

import { flowAIGraphQLRequest } from './flow-ai-client';

// ============================================================================
// Types
// ============================================================================

export type TakeoffStatusEnum = 'CLASSIFICATION' | 'ABRIDGMENT' | 'PARSING' | 'COMPLETE';

export interface TakeoffDocumentResponse {
  id: string;
  takeoffId: string;
  name: string;
  fileType: string;
  fileSize: string;
  documentUrl: string | null;
  classification: string | null;
  confidence: number | null;
  pages: number;
  abridged: boolean;
  abridgedPages: number | null;
  reductionPercentage: number | null;
  pageAnalyses: PageAnalysis[] | null;
  products: unknown;
  parsedItems: ParsedItem[] | null;
  createdAt: string;
}

export interface TakeoffResponse {
  id: string;
  title: string;
  source: string;
  createdBy: string;
  status: TakeoffStatusEnum;
  quoteId: string | null;
  userId: string;
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
  id?: string;
  manufacturer: string;
  partNumber: string;
  description: string;
  quantity: number;
  isOurManufacturer?: boolean;
  isCrossed?: boolean;
  crossedManufacturer?: string;
  crossedPartNumber?: string;
  crossedDescription?: string;
}

export interface TakeoffDocumentInput {
  name: string;
  fileType?: string;
  fileSize: string;
  documentUrl?: string | null;
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
  createdBy: string;
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
  name?: string | null;
  classification?: string | null;
  confidence?: number | null;
  pages?: number | null;
  abridged?: boolean | null;
  abridgedPages?: number | null;
  reductionPercentage?: number | null;
  pageAnalyses?: PageAnalysis[] | null;
  products?: unknown;
  parsedItems?: ParsedItem[] | null;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_USER_TAKEOFFS = `
  query GetUserTakeoffs($limit: Int, $offset: Int) {
    getUserTakeoffs(limit: $limit, offset: $offset) {
      id
      title
      source
      createdBy
      status
      quoteId
      userId
      metadata
      createdAt
      documents {
        id
        takeoffId
        name
        fileType
        fileSize
        documentUrl
        classification
        confidence
        pages
        abridged
        abridgedPages
        reductionPercentage
        pageAnalyses
        products
        parsedItems
        createdAt
      }
    }
  }
`;

const GET_TAKEOFF = `
  query GetTakeoff($takeoffId: UUID!) {
    getTakeoff(takeoffId: $takeoffId) {
      id
      title
      source
      createdBy
      status
      quoteId
      userId
      metadata
      createdAt
      documents {
        id
        takeoffId
        name
        fileType
        fileSize
        documentUrl
        classification
        confidence
        pages
        abridged
        abridgedPages
        reductionPercentage
        pageAnalyses
        products
        parsedItems
        createdAt
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_TAKEOFF = `
  mutation CreateTakeoff($input: CreateTakeoffInput!) {
    createTakeoff(input: $input) {
      id
      title
      source
      createdBy
      status
      quoteId
      userId
      metadata
      createdAt
      documents {
        id
        takeoffId
        name
        fileType
        fileSize
        documentUrl
        classification
        confidence
        pages
        abridged
        abridgedPages
        reductionPercentage
        createdAt
      }
    }
  }
`;

const UPDATE_TAKEOFF = `
  mutation UpdateTakeoff($takeoffId: UUID!, $input: UpdateTakeoffInput!) {
    updateTakeoff(takeoffId: $takeoffId, input: $input) {
      id
      title
      source
      createdBy
      status
      quoteId
      userId
      metadata
      createdAt
    }
  }
`;

const DELETE_TAKEOFF = `
  mutation DeleteTakeoff($takeoffId: UUID!) {
    deleteTakeoff(takeoffId: $takeoffId)
  }
`;

const UPDATE_TAKEOFF_DOCUMENT = `
  mutation UpdateTakeoffDocument($documentId: UUID!, $input: UpdateTakeoffDocumentInput!) {
    updateTakeoffDocument(documentId: $documentId, input: $input) {
      id
      takeoffId
      name
      fileType
      fileSize
      documentUrl
      classification
      confidence
      pages
      abridged
      abridgedPages
      reductionPercentage
      pageAnalyses
      products
      parsedItems
      createdAt
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all takeoffs for the current user
 */
export async function fetchUserTakeoffs(params?: {
  limit?: number;
  offset?: number;
}): Promise<TakeoffResponse[]> {
  const response = await flowAIGraphQLRequest<{ getUserTakeoffs: TakeoffResponse[] }>({
    query: GET_USER_TAKEOFFS,
    variables: {
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch takeoffs');
  }

  return response.data?.getUserTakeoffs || [];
}

/**
 * Fetch a single takeoff by ID
 */
export async function fetchTakeoff(takeoffId: string): Promise<TakeoffResponse | null> {
  const response = await flowAIGraphQLRequest<{ getTakeoff: TakeoffResponse | null }>({
    query: GET_TAKEOFF,
    variables: { takeoffId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch takeoff');
  }

  return response.data?.getTakeoff || null;
}

/**
 * Create a new takeoff
 */
export async function createTakeoff(input: CreateTakeoffInput): Promise<TakeoffResponse> {
  const response = await flowAIGraphQLRequest<{ createTakeoff: TakeoffResponse }>({
    query: CREATE_TAKEOFF,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create takeoff');
  }

  if (!response.data?.createTakeoff) {
    throw new Error('No takeoff returned from create mutation');
  }

  return response.data.createTakeoff;
}

/**
 * Update an existing takeoff
 */
export async function updateTakeoff(
  takeoffId: string,
  input: UpdateTakeoffInput
): Promise<TakeoffResponse> {
  const response = await flowAIGraphQLRequest<{ updateTakeoff: TakeoffResponse }>({
    query: UPDATE_TAKEOFF,
    variables: { takeoffId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update takeoff');
  }

  if (!response.data?.updateTakeoff) {
    throw new Error('No takeoff returned from update mutation');
  }

  return response.data.updateTakeoff;
}

/**
 * Delete a takeoff
 */
export async function deleteTakeoff(takeoffId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deleteTakeoff: boolean }>({
    query: DELETE_TAKEOFF,
    variables: { takeoffId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete takeoff');
  }

  return response.data?.deleteTakeoff || false;
}

/**
 * Update a takeoff document
 */
export async function updateTakeoffDocument(
  documentId: string,
  input: UpdateTakeoffDocumentInput
): Promise<TakeoffDocumentResponse> {
  const response = await flowAIGraphQLRequest<{ updateTakeoffDocument: TakeoffDocumentResponse }>({
    query: UPDATE_TAKEOFF_DOCUMENT,
    variables: { documentId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update takeoff document');
  }

  if (!response.data?.updateTakeoffDocument) {
    throw new Error('No document returned from update mutation');
  }

  return response.data.updateTakeoffDocument;
}
