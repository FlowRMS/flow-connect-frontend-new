import { NextRequest, NextResponse } from 'next/server';

const FLOWCRM_GRAPHQL_URL = process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL;

export async function POST(request: NextRequest) {
  try {
    if (!FLOWCRM_GRAPHQL_URL) {
      console.error('NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL is not configured');
      return NextResponse.json(
        { error: 'GraphQL endpoint not configured' },
        { status: 500 }
      );
    }

    // Get the form data from the request
    const formData = await request.formData();

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    const authProvider = request.headers.get('x-auth-provider');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Build headers for the backend request
    const headers: Record<string, string> = {
      'Authorization': authHeader,
    };

    if (authProvider) {
      headers['x-auth-provider'] = authProvider;
    }
    // Don't set Content-Type - let fetch set it with the correct boundary for multipart

    // Forward the multipart/form-data to the GraphQL API
    const response = await fetch(FLOWCRM_GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Upload failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-provider',
      },
    });
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-provider',
    },
  });
}
