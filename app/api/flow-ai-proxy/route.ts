/**
 * Flow-AI GraphQL Proxy API Route
 *
 * Proxies GraphQL requests to the flow-ai backend.
 * Needed to avoid CORS restrictions when calling flow-ai from the browser.
 * Supports both JSON and multipart/form-data (file uploads).
 */

import { NextRequest, NextResponse } from 'next/server';

const FLOW_AI_ENDPOINT = process.env.NEXT_PUBLIC_FLOW_AI_GRAPHQL_URL || 'http://localhost:8005/graphql';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the incoming request
    const authHeader = request.headers.get('authorization');
    const authProvider = request.headers.get('x-auth-provider');
    const contentType = request.headers.get('content-type') || '';

    // Build headers for the upstream request
    const headers: Record<string, string> = {};

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    if (authProvider) {
      headers['x-auth-provider'] = authProvider;
    }

    let body: BodyInit;

    // Handle multipart/form-data (file uploads)
    if (contentType.includes('multipart/form-data')) {
      // For multipart, we need to pass through the raw body
      // and let fetch handle the content-type with boundary
      const formData = await request.formData();
      body = formData;
      // Don't set Content-Type - fetch will set it with the correct boundary
    } else {
      // JSON request
      const jsonBody = await request.json();
      body = JSON.stringify(jsonBody);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(FLOW_AI_ENDPOINT, {
      method: 'POST',
      headers,
      body,
    });

    // Check if response is JSON
    const responseContentType = response.headers.get('content-type') || '';

    if (responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    } else {
      // Non-JSON response (e.g., file download)
      const data = await response.arrayBuffer();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType,
          'Cache-Control': 'no-store',
        },
      });
    }
  } catch (error) {
    console.error('[flow-ai-proxy] Error:', error);
    return NextResponse.json(
      {
        errors: [
          {
            message: error instanceof Error ? error.message : 'Proxy error',
          },
        ],
      },
      { status: 500 }
    );
  }
}
