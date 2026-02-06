import { GraphQLClient } from 'graphql-request';
import { getDistributorStats as getMockStats } from './nemra-pos-data';

export function getGraphQLClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_GRAPHQL_URL || process.env.GRAPHQL_URL;
  if (!url) return null;
  const headers: Record<string, string> = {};
  // Prefer explicit API key header if provided
  const apiKey = process.env.GRAPHQL_API_KEY || process.env.NEXT_PUBLIC_GRAPHQL_API_KEY;
  if (apiKey) headers['x-api-key'] = apiKey;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new GraphQLClient(url, { headers });
}

// Helper that attempts to call the real GraphQL endpoint if available,
// otherwise falls back to local mock data so pages still render during development.
export async function safeRequest<T>(query: string, variables?: Record<string, any>, token?: string): Promise<T> {
  const client = getGraphQLClient(token);
  if (!client) {
    // No GRAPHQL_URL configured; return a mocked shape for common queries
    if (query.includes('GetDistributorStats')) {
      const mock = getMockStats();
      // map to expected GraphQL shape
      return {
        distributorStats: {
          totalSends: mock.totalSends,
          totalManufacturers: mock.totalManufacturers,
          recentSends: [],
        },
      } as any;
    }

    throw new Error('No GraphQL client configured (set GRAPHQL_URL)');
  }

  try {
    return await client.request<T>(query, variables);
  } catch (err: any) {
    // Include the query name or first 80 chars for easier debugging
    const preview = query.split('\n').map(l => l.trim()).join(' ').slice(0, 80);
    throw new Error(`GraphQL request failed (${preview}): ${err?.message ?? err}`);
  }
}
