import { GraphQLClient } from 'graphql-request';

/**
 * Check if variables contain any File objects (for multipart upload)
 */
function containsFile(variables?: Record<string, any>): boolean {
  if (!variables) return false;
  return Object.values(variables).some(
    value => value instanceof File || value instanceof Blob
  );
}

export function getBrowserGraphQLClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (!url) return null;
  const headers: Record<string, string> = {};

  // Add bearer token if provided (WorkOS auth)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Also add API key if configured (for dev/testing or as fallback)
  const apiKey = process.env.NEXT_PUBLIC_GRAPHQL_API_KEY;
  if (apiKey && !token) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return new GraphQLClient(url, { headers });
}

/**
 * Make a GraphQL request with automatic file upload support.
 * Uses the graphql-request library which handles multipart uploads
 * when File objects are present in variables.
 */
export async function requestGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>,
  token?: string
): Promise<T> {
  const client = getBrowserGraphQLClient(token);
  if (!client) {
    throw new Error('No GraphQL client configured (set NEXT_PUBLIC_GRAPHQL_URL)');
  }

  // For file uploads, graphql-request handles multipart form data automatically
  // when the variable contains a File or Blob object
  return client.request<T>(query, variables);
}
