import { requestGraphQL } from './graphqlClient';

// Types matching the backend schema
export interface RepFirm {
  id: string;
  name: string;
  domain?: string;
}

// GraphQL Query for fetching rep firms
const ConnectionSearchQuery = `
  query ConnectionSearch($searchTerm: String!, $repFirms: Boolean!) {
    connectionSearch(searchTerm: $searchTerm, repFirms: $repFirms, limit: 100) {
      id
      name
      domain
    }
  }
`;

/**
 * Fetch rep firms using the connectionSearch query
 * @param token Access token for authentication
 * @param searchTerm Optional search term to filter rep firms (default: empty string to get all)
 */
export async function fetchRepFirms(
  token?: string,
  searchTerm: string = ''
): Promise<RepFirm[]> {
  const data = await requestGraphQL<{ connectionSearch: RepFirm[] }>(
    ConnectionSearchQuery,
    { searchTerm, repFirms: true },
    token
  );
  return data.connectionSearch;
}
