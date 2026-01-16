import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

const CRM_GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL;

const SEARCH_CUSTOMERS_QUERY = `
  query SearchCustomers($searchTerm: String!, $published: Boolean) {
    customerSearch(searchTerm: $searchTerm, published: $published) {
      id
      companyName
      parentId
    }
  }
`;

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await withAuth();

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!CRM_GRAPHQL_URL) {
      return NextResponse.json(
        { error: 'CRM API endpoint not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { searchTerm, published = true } = body;

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({ data: { customerSearch: [] } });
    }

    const response = await fetch(CRM_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Auth-Provider': 'WORKOS',
      },
      body: JSON.stringify({
        query: SEARCH_CUSTOMERS_QUERY,
        variables: { searchTerm, published },
      }),
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[takeoffs/customer-search] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
