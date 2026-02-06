/**
 * Prefix Patterns GraphQL SDK
 * 
 * Handles CRUD operations for prefix patterns.
 * Prefix patterns are used to identify and route data based on naming conventions.
 */

import { requestGraphQL } from '../graphqlClient';
import type {
  PrefixPatternResponse,
  CreatePrefixPatternInput,
  PrefixPatternsResult,
  CreatePrefixPatternResult,
  DeletePrefixPatternResult,
} from './types';

// ============================================
// QUERIES
// ============================================

const PrefixPatternsQuery = `
  query PrefixPatterns {
    prefixPatterns {
      id
      name
      description
      createdAt
    }
  }
`;

// ============================================
// MUTATIONS
// ============================================

const CreatePrefixPatternMutation = `
  mutation CreatePrefixPattern($input: CreatePrefixPatternInput!) {
    createPrefixPattern(input: $input) {
      id
      name
      description
      createdAt
    }
  }
`;

const DeletePrefixPatternMutation = `
  mutation DeletePrefixPattern($id: ID!) {
    deletePrefixPattern(id: $id)
  }
`;

// ============================================
// SDK FUNCTIONS
// ============================================

/**
 * Fetch all prefix patterns.
 */
export async function getPrefixPatterns(
  token?: string
): Promise<PrefixPatternResponse[]> {
  try {
    const result = await requestGraphQL<PrefixPatternsResult>(
      PrefixPatternsQuery,
      {},
      token
    );
    return result.prefixPatterns;
  } catch (error) {
    console.error('getPrefixPatterns failed:', error);
    throw error;
  }
}

/**
 * Create a new prefix pattern.
 */
export async function createPrefixPattern(
  input: CreatePrefixPatternInput,
  token?: string
): Promise<PrefixPatternResponse> {
  try {
    const result = await requestGraphQL<CreatePrefixPatternResult>(
      CreatePrefixPatternMutation,
      { input },
      token
    );
    return result.createPrefixPattern;
  } catch (error) {
    console.error('createPrefixPattern failed:', error);
    throw error;
  }
}

/**
 * Delete a prefix pattern by ID.
 * Returns true if deletion was successful.
 */
export async function deletePrefixPattern(
  id: string,
  token?: string
): Promise<boolean> {
  try {
    const result = await requestGraphQL<DeletePrefixPatternResult>(
      DeletePrefixPatternMutation,
      { id },
      token
    );
    return result.deletePrefixPattern;
  } catch (error) {
    console.error('deletePrefixPattern failed:', error);
    throw error;
  }
}
