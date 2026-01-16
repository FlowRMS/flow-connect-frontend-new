/**
 * Takeoffs Core API Functions
 * CRUD operations for takeoffs
 */

import { flowAIGraphQLRequest } from '../flow-ai-client';
import {
  GET_USER_TAKEOFFS,
  GET_USER_TAKEOFFS_PAGINATED,
  GET_TAKEOFF,
} from './queries';
import {
  CREATE_TAKEOFF,
  UPDATE_TAKEOFF,
  DELETE_TAKEOFF,
  UPDATE_TAKEOFF_DOCUMENT,
} from './mutations';
import type {
  TakeoffResponse,
  TakeoffDocumentResponse,
  CreateTakeoffInput,
  UpdateTakeoffInput,
  UpdateTakeoffDocumentInput,
  FetchTakeoffsParams,
  TakeoffsPaginatedResult,
} from './types';

/**
 * Fetch takeoffs for the current user with optional filtering
 */
export async function fetchUserTakeoffs(params?: FetchTakeoffsParams): Promise<TakeoffResponse[]> {
  const response = await flowAIGraphQLRequest<{ getUserTakeoffs: TakeoffResponse[] }>({
    query: GET_USER_TAKEOFFS,
    variables: {
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
      search: params?.search || null,
      status: params?.status || null,
      source: params?.source || null,
      title: params?.title || null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch takeoffs');
  }

  return response.data?.getUserTakeoffs || [];
}

/**
 * Fetch takeoffs with pagination info (total count)
 */
export async function fetchUserTakeoffsPaginated(params?: FetchTakeoffsParams): Promise<TakeoffsPaginatedResult> {
  const response = await flowAIGraphQLRequest<{
    getUserTakeoffsPaginated: { takeoffs: TakeoffResponse[]; totalCount: number };
  }>({
    query: GET_USER_TAKEOFFS_PAGINATED,
    variables: {
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
      search: params?.search || null,
      status: params?.status || null,
      source: params?.source || null,
      title: params?.title || null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch takeoffs');
  }

  return response.data?.getUserTakeoffsPaginated || { takeoffs: [], totalCount: 0 };
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
    console.error('[createTakeoff] GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to create takeoff');
  }

  if (!response.data?.createTakeoff) {
    console.error('[createTakeoff] No takeoff in response');
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
