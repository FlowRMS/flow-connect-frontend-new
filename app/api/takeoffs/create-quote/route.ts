import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

const CRM_GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL;

const CREATE_QUOTE_MUTATION = `
  mutation CreateQuote($input: QuoteInput!) {
    createQuote(input: $input) {
      id
      quoteNumber
      status
      pipelineStage
      entityDate
      soldToCustomerId
      details {
        id
        itemNumber
        quantity
        unitPrice
        productNameAdhoc
        productDescriptionAdhoc
      }
    }
  }
`;

const CHECK_QUOTE_EXISTS_QUERY = `
  query QuoteSearch($searchTerm: String!) {
    quoteSearch(searchTerm: $searchTerm) {
      id
      quoteNumber
    }
  }
`;

export interface CreateQuoteRequest {
  quoteNumber: string;
  soldToCustomerId: string;
  customerRef?: string;
  details: Array<{
    itemNumber: number;
    quantity: number;
    unitPrice: string;
    productNameAdhoc?: string;
    productDescriptionAdhoc?: string;
    note?: string;
  }>;
}

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

    const body: CreateQuoteRequest = await request.json();
    const { quoteNumber, soldToCustomerId, customerRef, details } = body;

    // Validate required fields
    if (!quoteNumber?.trim()) {
      return NextResponse.json(
        { error: 'Quote number is required' },
        { status: 400 }
      );
    }

    if (!soldToCustomerId) {
      return NextResponse.json(
        { error: 'Customer is required' },
        { status: 400 }
      );
    }

    // Check if quote number already exists
    const checkResponse = await fetch(CRM_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Auth-Provider': 'WORKOS',
      },
      body: JSON.stringify({
        query: CHECK_QUOTE_EXISTS_QUERY,
        variables: { searchTerm: quoteNumber.trim() },
      }),
    });

    const checkResult = await checkResponse.json();
    const existingQuotes = checkResult.data?.quoteSearch || [];

    // Check for exact match
    const exactMatch = existingQuotes.find(
      (q: { quoteNumber: string }) =>
        q.quoteNumber.toLowerCase() === quoteNumber.trim().toLowerCase()
    );

    if (exactMatch) {
      return NextResponse.json(
        { error: `Quote number "${quoteNumber}" already exists` },
        { status: 409 }
      );
    }

    // Build quote input
    const quoteInput = {
      quoteNumber: quoteNumber.trim(),
      entityDate: new Date().toISOString().split('T')[0],
      soldToCustomerId,
      status: 'OPEN',
      pipelineStage: 'PROSPECT',
      published: true,
      creationType: 'MANUAL',
      blanket: false,
      insidePerLineItem: true,
      outsidePerLineItem: true,
      endUserPerLineItem: false,
      factoryPerLineItem: false,
      customerRef: customerRef || undefined,
      details: details.map((detail, index) => ({
        itemNumber: detail.itemNumber || index + 1,
        quantity: detail.quantity || 1,
        unitPrice: detail.unitPrice || '0',
        productNameAdhoc: detail.productNameAdhoc || null,
        productDescriptionAdhoc: detail.productDescriptionAdhoc || null,
        note: detail.note || null,
        status: 'OPEN',
        discountRate: '0',
        commissionRate: '0',
        commissionDiscountRate: '0',
      })),
    };

    // Create the quote
    const response = await fetch(CRM_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Auth-Provider': 'WORKOS',
      },
      body: JSON.stringify({
        query: CREATE_QUOTE_MUTATION,
        variables: { input: quoteInput },
      }),
    });

    const result = await response.json();

    if (result.errors?.length > 0) {
      const errorMessage = result.errors[0]?.message || 'Failed to create quote';
      console.error('[takeoffs/create-quote] GraphQL Error:', result.errors);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[takeoffs/create-quote] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create quote' },
      { status: 500 }
    );
  }
}
