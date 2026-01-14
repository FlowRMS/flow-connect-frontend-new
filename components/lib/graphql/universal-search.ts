/**
 * Universal Search GraphQL Module
 * GraphQL queries and API functions for Universal Search
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export interface UniversalSearchResult {
  id: string;
  alias?: string;
  resultType: string;
  title: string;
  extraInfo?: string;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const UNIVERSAL_SEARCH = `
  query UniversalSearch($searchTerm: String!, $limit: Int) {
    universalSearch(searchTerm: $searchTerm, limit: $limit) {
      alias
      id
      resultType
      title
      extraInfo
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

export async function universalSearch(searchTerm: string, limit: number = 10): Promise<UniversalSearchResult[]> {
  const response = await crmGraphQLRequest<{ universalSearch: UniversalSearchResult[] }>({
    query: UNIVERSAL_SEARCH,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to perform universal search');
  }

  return response.data?.universalSearch || [];
}
